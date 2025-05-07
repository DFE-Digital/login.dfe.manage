const {
  removeServiceFromUser,
  removeServiceFromInvitation,
} = require("../../infrastructure/access");
const { getServiceById } = require("../../infrastructure/applications");
const {
  getUserDetails,
  waitForIndexToUpdate,
  getUserServiceRoles,
  getReturnUrl,
} = require("./utils");
const { getOrganisationByIdV2 } = require("../../infrastructure/organisations");
const {
  getSearchDetailsForUserById,
  updateIndex,
} = require("../../infrastructure/search");

const logger = require("../../infrastructure/logger");

const getModel = async (req) => {
  const service = await getServiceById(req.params.sid, req.id);
  const user = await getUserDetails(req);
  const organisation = await getOrganisationByIdV2(req.params.oid, req.id);
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
    await removeServiceFromInvitation(
      req.params.uid.substr(4),
      req.params.sid,
      req.params.oid,
      req.id,
    );
  } else {
    await removeServiceFromUser(
      req.params.uid,
      req.params.sid,
      req.params.oid,
      req.id,
    );
  }

  const getAllUserDetails = await getSearchDetailsForUserById(
    req.params.uid,
    req.id,
  );
  const currentServiceDetails = getAllUserDetails.services;
  const serviceRemoved = currentServiceDetails.findIndex(
    (x) => x === req.params.sid,
  );
  const updatedServiceDetails = currentServiceDetails.filter(
    (_, index) => index !== serviceRemoved,
  );
  await updateIndex(
    req.params.uid,
    { services: updatedServiceDetails },
    req.id,
  );
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
