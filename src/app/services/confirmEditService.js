const {
  getServiceRaw,
  getServiceRolesRaw,
} = require("login.dfe.api-client/services");
const { updateUserServiceRoles } = require("login.dfe.api-client/users");
const { getOrganisationRaw } = require("login.dfe.api-client/organisations");
const {
  updateInvitationServiceRoles,
} = require("login.dfe.api-client/invitations");
const {
  getUserDetails,
  getUserServiceRoles,
  getReturnUrl,
} = require("./utils");
const logger = require("../../infrastructure/logger");

const getModel = async (req) => {
  const service = await getServiceRaw({
    by: { serviceId: req.params.sid },
  });
  const allRolesForService = await getServiceRolesRaw({
    serviceId: req.params.sid,
  });
  const selectedRoleIds = req.session.service.roles;
  const roleDetails = allRolesForService.filter((x) =>
    selectedRoleIds.find((y) => y.toLowerCase() === x.id.toLowerCase()),
  );
  const organisation = await getOrganisationRaw({
    by: { organisationId: req.params.oid },
  });
  const user = await getUserDetails(req);
  const manageRolesForService = await getUserServiceRoles(req);

  return {
    csrfToken: req.csrfToken(),
    backLink: getReturnUrl(
      req.query,
      `/services/${req.params.sid}/users/${req.params.uid}/organisations/${organisation.id}`,
    ),
    cancelLink: getReturnUrl(
      req.query,
      `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    ),
    service,
    roles: roleDetails,
    user,
    organisation,
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentNavigation: "users",
  };
};

const updateService = async (uid, sid, oid, selectedRoles) => {
  const update = uid.startsWith("inv-")
    ? await updateInvitationServiceRoles({
        invitationId: uid.substr(4),
        serviceId: sid,
        organisationId: oid,
        serviceRoleIds: selectedRoles,
      })
    : updateUserServiceRoles({
        userId: uid,
        serviceId: sid,
        organisationId: oid,
        serviceRoleIds: selectedRoles,
      });
  return update;
};

const get = async (req, res) => {
  const model = await getModel(req);

  return res.render("services/views/confirmEditService", model);
};

const post = async (req, res) => {
  const model = await getModel(req);

  const selectedRoles = req.session.service.roles;

  await updateService(
    req.params.uid,
    req.params.sid,
    req.params.oid,
    selectedRoles,
  );

  logger.audit(
    `${req.user.email} updated service for user ${model.user.email}`,
    {
      type: "manage",
      subType: "user-service-updated",
      userId: req.user.sub,
      userEmail: req.user.email,
      organisationId: model.organisation.id,
      client: model.service.relyingParty.client_id,
      editedUser: model.user.id,
      editedFields: [
        {
          name: "update_service",
          newValue: selectedRoles,
        },
      ],
    },
  );

  res.flash("title", "Success");
  res.flash("heading", `Service updated: ${model.service.name}`);
  res.flash(
    "message",
    "Approvers at the relevant organisation have been notified of this change.",
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
