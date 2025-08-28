const logger = require("../../infrastructure/logger");
const {
  listAllServices,
  getServiceById,
  updateService,
} = require("../../infrastructure/applications");
const {
  listRolesOfService,
  updateRole,
} = require("../../infrastructure/access");
const config = require("../../infrastructure/config");

const postConfirmEditServiceInfo = async (req, res) => {
  const model = req.session.editServiceInfo;
  const serviceId = req.params.sid;
  const correlationId = req.id;
  if (!model) {
    return res.redirect(`/services/${serviceId}/service-information`);
  }

  const service = await getServiceById(req.params.sid, correlationId);

  if (model.name && service.name !== model.name) {
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
      return res.redirect(`/services/${serviceId}/service-information`);
    }
  }

  await updateService(serviceId, model, correlationId);
  logger.info(
    `Successfully updated service details for service [${serviceId}]`,
    {
      correlationId: req.id,
    },
  );

  if (model.name && service.name !== model.name) {
    logger.info(
      `Service name changed for service [${serviceId}]. Attempting to update internal manage roles so service name matches`,
      { correlationId: req.id },
    );
    // Check for internal manage roles and update service name to new one
    const manageServiceId = config.access.identifiers.service;
    const rolesOfService = await listRolesOfService(
      manageServiceId,
      correlationId,
    );
    const roles = rolesOfService.filter((role) =>
      role.name.startsWith(service.name),
    );
    logger.info(
      `Found [${roles.length}] internal manage roles for service [${serviceId}]`,
      { correlationId: correlationId },
    );

    await Promise.all(
      roles.map(async (role) => {
        // Turns 'servicename - manage role name' into ' - manage role name'
        const roleSecondHalf = role.name.substring(
          service.name.length,
          role.name.length,
        );
        const updatedRoleName = model.name + roleSecondHalf;
        try {
          await updateRole(manageServiceId, role.id, { name: updatedRoleName });
        } catch (e) {
          // TODO what do we do if role update fails? Flash a message?
          logger.error(e);
        }
      }),
    );
  }

  // TODO figure out what bits changed and add them to the editedFields array
  // logger.audit(
  //   `${req.user.email} (id: ${req.user.sub}) updated the name and/or description of service ${req.params.sid}`,
  //   {
  //     type: "manage",
  //     subType: "service-info-edit",
  //     userId: req.user.sub,
  //     userEmail: req.user.email,
  //     name: model.name,
  //     description: model.description,
  //     editedFields: [
  //       {
  //         name: "delete_banner",
  //         oldValue: req.params.bid,
  //         newValue: undefined,
  //       },
  //     ],
  //   },
  // );

  req.session.editServiceInfo = undefined;
  // TODO service-information page doesn't render flash, so need to add that
  const flashServiceName = model.name ? model.name : service.name;
  let flashMessageText;
  if (model.name && model.description) {
    flashMessageText = "Successfully updated service name and description";
  } else if (model.description) {
    flashMessageText = "Successfully updated service description";
  } else {
    flashMessageText = "Successfully updated service name";
  }

  res.flash("title", "Success");
  res.flash("heading", `Service updated: ${flashServiceName}`);
  res.flash("message", flashMessageText);

  return res.redirect(`/services/${req.params.sid}/service-information`);
};

module.exports = postConfirmEditServiceInfo;
