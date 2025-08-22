const logger = require("../../infrastructure/logger");
const {
  listAllServices,
  getServiceById,
  updateService,
} = require("../../infrastructure/applications");

const postConfirmEditServiceInfo = async (req, res) => {
  const model = req.session.editServiceInfo;
  if (!model) {
    // TODO figure out where to redirect too
    logger.info("No model, redirecting away");
    return res.redirect("edit");
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
      // TODO figure out how to handle it if the name changed in the meantime
      logger.info(
        "Service name must be unique and cannot already exist in DfE Sign-in",
      );
      return res.redirect(
        `/services/${req.params.sid}/service-information/edit`,
      );
    }
  }

  // const serviceRoles = Get roles
  // if (serviceRoles) {
  //     const internalRoles = find roles ending with service configuation, service banner, Service Access Management and Service Support
  //     if (internalRoles) {
  //         Get policy and role data
  //         Shape it (renaming the start to the new name)
  //         Patch it
  //     }
  //}

  const updatedService = {
    name: model.name,
    description: model.description,
  };
  await updateService(req.params.sid, updatedService, req.id);
  logger.info("Update the role data (if required)");

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
  res.flash("info", `Successfully updated service name and/or description`);

  return res.redirect(`/services/${req.params.sid}/service-information`);
};

module.exports = postConfirmEditServiceInfo;
