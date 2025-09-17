const { NotificationClient } = require("login.dfe.jobs-client");
const config = require("../../infrastructure/config");
const { getServiceRaw } = require("login.dfe.api-client/services");
const { getOrganisationRaw } = require("login.dfe.api-client/organisations");
const {
  addServiceToUser,
  getUserOrganisationsWithServicesRaw,
} = require("login.dfe.api-client/users");
const { addServiceToInvitation, getInvitationOrganisationsRaw } = require("login.dfe.api-client/invitations");

const { listRolesOfService } = require("../../infrastructure/access");
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
  const allRolesForService = await listRolesOfService(req.params.sid, req.id);
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
      `/services/${req.params.sid}/users/${req.params.uid}/organisations/${organisation.id}/associate-service`,
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

const get = async (req, res) => {
  const model = await getModel(req);
  return res.render("services/views/confirmAssociateService", model);
};

const post = async (req, res) => {
  const model = await getModel(req);
  const { user, organisation, service, roles } = model;

  const selectedRoles = req.session.service.roles;
  const invitationId = user.id.startsWith("inv-")
    ? user.id.substr(4)
    : undefined;

  const userOrganisations = invitationId
    ? await getInvitationOrganisationsRaw({ invitationId })
    : await getUserOrganisationsWithServicesRaw({ userId: user.id });
  const organisationDetails = userOrganisations.find(
    (x) => x.organisation.id === organisation.id,
  );

  const userOrgPermission = {
    id: organisationDetails.role.id,
    name: organisationDetails.role.name,
  };

  const notificationClient = new NotificationClient({
    connectionString: config.notifications.connectionString,
  });

  if (invitationId) {
    await addServiceToInvitation({
      invitationId: invitationId,
      serviceId: service.id,
      organisationId: organisation.id,
      serviceRoleIds: selectedRoles,
    });
  } else {
    await addServiceToUser({
      userId: user.id,
      serviceId: service.id,
      organisationId: organisation.id,
      serviceRoleIds: selectedRoles,
    });
  }

  await notificationClient.sendServiceRequestApproved(
    user.email,
    user.firstName,
    user.lastName,
    organisation.name,
    service.name,
    roles.map((r) => r.name),
    userOrgPermission,
  );

  logger.audit(
    `${req.user.email} added service ${service.name} for user ${user.email}`,
    {
      type: "manage",
      subType: "user-service-added",
      userId: req.user.sub,
      userEmail: req.user.email,
      organisationId: organisation.id,
      editedFields: [
        {
          name: "add_services",
          newValue: {
            id: service.id,
            roles: selectedRoles,
          },
        },
      ],
      editedUser: user.id,
    },
  );

  res.flash("title", "Success");
  res.flash("heading", `Service added: ${service.name}`);
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
