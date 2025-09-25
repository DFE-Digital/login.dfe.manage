const { getServiceRaw } = require("login.dfe.api-client/services");
const { deleteUserServiceAccess } = require("login.dfe.api-client/users");
const { getOrganisationRaw } = require("login.dfe.api-client/organisations");
const {
  deleteServiceAccessFromInvitation,
} = require("login.dfe.api-client/invitations");
const {
  searchUserByIdRaw,
  updateUserDetailsInSearchIndex,
} = require("login.dfe.api-client/users");
const {
  getUserDetails,
  waitForIndexToUpdate,
  getUserServiceRoles,
  getReturnUrl,
} = require("./utils");
const { mapSearchUserToSupportModel } = require("../../infrastructure/utils");

const logger = require("../../infrastructure/logger");

const getModel = async (req) => {
  const service = await getServiceRaw({
    by: { serviceId: req.params.sid },
  });
  const user = await getUserDetails(req);
  const organisation = await getOrganisationRaw({
    by: { organisationId: req.params.oid },
  });
  const manageRolesForService = await getUserServiceRoles(req);

  return {
    backLink: getReturnUrl(
      req.query,
      `/services/${req.params.sid}/users/${req.params.uid}/organisations/${organisation.id}`,
    ),
    cancelLink: getReturnUrl(
      req.query,
      `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    ),
    csrfToken: req.csrfToken(),
    organisation,
    user,
    service,
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentNavigation: "users",
  };
};

const get = async (req, res) => {
  const model = await getModel(req);
  return res.render("services/views/removeService", model);
};

const post = async (req, res) => {
  const model = await getModel(req);

  if (req.params.uid.startsWith("inv-")) {
    await deleteServiceAccessFromInvitation({
      invitationId: req.params.uid.substr(4),
      serviceId: req.params.sid,
      organisationId: req.params.oid,
    });
  } else {
    await deleteUserServiceAccess({
      userId: req.params.uid,
      serviceId: req.params.sid,
      organisationId: req.params.oid,
    });
  }

  const getAllUserDetails = mapSearchUserToSupportModel(
    await searchUserByIdRaw({ userId: req.params.uid }),
  );
  const updatedServiceDetails = getAllUserDetails.services.filter(
    (serviceId) => serviceId !== req.params.sid,
  );
  await updateUserDetailsInSearchIndex({
    userId: req.params.uid,
    servicesIds: updatedServiceDetails,
  });
  await waitForIndexToUpdate(
    req.params.uid,
    (updated) => updated.services.length === updatedServiceDetails.length,
  );

  logger.audit(
    `${req.user.email} removed service ${model.service.name} for user ${model.user.email}`,
    {
      type: "manage",
      subType: "user-service-deleted",
      userId: req.user.sub,
      userEmail: req.user.email,
      organisationId: model.organisation.id,
      editedUser: model.user.id,
      editedFields: [
        {
          name: "remove_service",
          oldValue: model.service.id,
          newValue: undefined,
        },
      ],
    },
  );

  res.flash(
    "info",
    `${model.user.firstName} ${model.user.lastName} removed from ${model.service.name}`,
  );

  return res.redirect(
    getReturnUrl(
      req.query,
      `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    ),
  );
};

module.exports = {
  get,
  post,
};
