const logger = require("../../infrastructure/logger");
const { updateService } = require("../../infrastructure/utils/services");
const {
  getServiceRaw,
  getServiceRolesRaw,
  getPaginatedServicesRaw,
} = require("login.dfe.api-client/services");
const { updateRole } = require("../../infrastructure/access");
const config = require("../../infrastructure/config");

const postConfirmEditServiceInfo = async (req, res) => {
  const model = req.session.editServiceInfo;
  const serviceId = req.params.sid;
  const correlationId = req.id;
  if (!model) {
    return res.redirect(`/services/${serviceId}/service-information`);
  }

  const service = await getServiceRaw({
    by: { serviceId: req.params.sid },
  });

  if (model.name) {
    // Only check if the name was changed
    const allServices = await getPaginatedServicesRaw({
      pageSize: 1000,
      pageNumber: 1,
    });
    const modelNameLower = model.name.toLowerCase();
    const isMatchingName = allServices.services.find(
      (service) =>
        service.name.toLowerCase() === modelNameLower &&
        service.id !== req.params.sid,
    );
    if (isMatchingName) {
      res.flash(
        "error",
        "Service name must be unique and cannot already exist in DfE Sign-in",
      );
      return res.redirect(`/services/${serviceId}/service-information`);
    }
  }

  await updateService(serviceId, model);

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
    const rolesOfService = await getServiceRolesRaw({
      serviceId: manageServiceId,
    });
    // Internal manage role codes are in the form of 'serviceId_role' (e.g., service-id_serviceconfig)
    const roles = rolesOfService.filter((role) =>
      role.code.toLowerCase().startsWith(serviceId.toLowerCase()),
    );
    logger.info(
      `Found [${roles.length}] internal manage roles for service [${serviceId}]`,
      { correlationId: correlationId },
    );

    let roleFailedToUpdate = false;

    await Promise.all(
      roles.map(async (role) => {
        // This assumes the internal roles are always in the form of 'service - role'
        // where the role never has a dash in it.
        const roleSecondHalf = role.name.split("-").at(-1);
        const updatedRoleName = model.name + " -" + roleSecondHalf;
        try {
          await updateRole(manageServiceId, role.id, { name: updatedRoleName });
        } catch (e) {
          // Error happening here isn't fatal, so we'll continue but log an error and flash a message to the user.
          roleFailedToUpdate = true;
          logger.error(e);
        }
      }),
    );

    if (roleFailedToUpdate) {
      res.flash("title", "Info");
      res.flash("heading", "Role failed to update");
      res.flash(
        "message",
        "An internal role failed to update.  Please notify us of this.",
      );
    }
  }

  let flashMessageText;
  const editedFields = [];
  if (model.name && model.description) {
    flashMessageText = "Successfully updated service name and description";
    editedFields.push({
      name: "name",
      oldValue: service.name,
      newValue: model.name,
    });
    editedFields.push({
      name: "description",
      oldValue: service.description,
      newValue: model.description,
    });
  } else if (model.description) {
    flashMessageText = "Successfully updated service description";
    editedFields.push({
      name: "description",
      oldValue: service.description,
      newValue: model.description,
    });
  } else {
    flashMessageText = "Successfully updated service name";
    editedFields.push({
      name: "name",
      oldValue: service.name,
      newValue: model.name,
    });
  }

  logger.audit(
    `${req.user.email} updated the name and/or description of service`,
    {
      type: "manage",
      subType: "service-info-edit",
      userId: req.user.sub,
      userEmail: req.user.email,
      client: service.relyingParty.client_id,
      editedFields,
    },
  );

  req.session.editServiceInfo = undefined;
  const flashServiceName = model.name ? model.name : service.name;

  res.flash("title", "Success");
  res.flash("heading", `Service updated: ${flashServiceName}`);
  res.flash("message", flashMessageText);

  return res.redirect(`/services/${req.params.sid}/service-information`);
};

module.exports = postConfirmEditServiceInfo;
