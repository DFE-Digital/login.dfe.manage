const logger = require("../../infrastructure/logger");
const {
  listAllServices,
  getServiceById,
  updateService,
} = require("../../infrastructure/applications");
const { listRolesOfService } = require("../../infrastructure/access");
const config = require("../../infrastructure/config");

const postConfirmEditServiceInfo = async (req, res) => {
  const model = req.session.editServiceInfo;
  if (!model) {
    return res.redirect(`/services/${req.params.sid}/service-information/`);
  }

  // TODO pass existing name and desc (maybe id) in session to stop us having
  // to make this call repeatedly
  const service = await getServiceById(req.params.sid, req.id);

  if (service.name !== model.name) {
    // Only check if the name was changed
    const allServices = await listAllServices();
    const isMatchingName = allServices.services.find(
      (service) => service.name === model.name,
    );
    if (isMatchingName) {
      // TODO service-information page needs to handle flash
      res.flash(
        "error",
        "Service name must be unique and cannot already exist in DfE Sign-in",
      );
      return res.redirect(`/services/${req.params.sid}/service-information/`);
    }
  }

  const updatedService = {
    name: model.name,
    description: model.description,
  };
  await updateService(req.params.sid, updatedService, req.id);
  logger.info("Successfully updated service details", {
    correlationId: req.id,
  });

  if (service.name !== model.name) {
    logger.info(
      "Service name changed.  Updating any internal manage roles for the service",
      { correlationId: req.id },
    );
    // Check for internal manage roles and update service name to new one
    const manageServiceId = config.access.identifiers.service;
    const rolesOfService = await listRolesOfService(manageServiceId, req.id);
    const roles = rolesOfService.filter((role) =>
      role.name.startsWith(service.name),
    );
    console.log(roles);
    // roles.forEach((role) => {
    // Amend role name to include new service name
    // call patch role endpoint
    // });
  }

  // logger.audit(
  //   `${req.user.email} (id: ${req.user.sub}) updated the name and/or description of service ${req.params.sid}`,
  //   {
  //     type: "manage",
  //     subType: "service-info-edit",
  //     userId: req.user.sub,
  //     userEmail: req.user.email,
  //     name: model.name,
  //     description: model.description,
  //   },
  // );

  req.session.editServiceInfo = undefined;
  // TODO service-information page doesn't render flash, so need to add that
  res.flash("info", `Successfully updated service name and/or description`);

  return res.redirect(`/services/${req.params.sid}/service-information`);
};

module.exports = postConfirmEditServiceInfo;
