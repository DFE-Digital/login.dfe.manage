const NotificationClient = require('login.dfe.notifications.client');
const config = require('../../infrastructure/config');
const { getServiceById } = require('../../infrastructure/applications');
const { listRolesOfService, addUserService, addInvitationService } = require('../../infrastructure/access');
const { getUserDetails, getUserServiceRoles } = require('./utils');
const { getOrganisationByIdV2 } = require('../../infrastructure/organisations');
const logger = require('../../infrastructure/logger');

const getModel = async (req) => {
  const service = await getServiceById(req.params.sid, req.id);
  const allRolesForService = await listRolesOfService(req.params.sid, req.id);
  const selectedRoleIds = req.session.service.roles;
  const roleDetails = allRolesForService.filter((x) => selectedRoleIds.find((y) => y.toLowerCase() === x.id.toLowerCase()));
  const organisation = await getOrganisationByIdV2(req.params.oid, req.id);
  const user = await getUserDetails(req);
  const manageRolesForService = await getUserServiceRoles(req);

  return {
    csrfToken: req.csrfToken(),
    backLink: true,
    cancelLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    service,
    roles: roleDetails,
    user,
    organisation,
    userRoles: manageRolesForService,
    currentNavigation: 'users',
  };
};

const get = async (req, res) => {
  const model = await getModel(req);
  return res.render('services/views/confirmAssociateService', model);
};

const post = async (req, res) => {
  const model = await getModel(req);
  const {
    user, organisation, service, roles,
  } = model;

  const selectedRoles = req.session.service.roles;
  const notificationClient = new NotificationClient({ connectionString: config.notifications.connectionString });
  if (user.id.startsWith('inv-')) {
    const invitationId = user.id.substr(4);
    await addInvitationService(invitationId, service.id, organisation.id, selectedRoles, req.id);
  } else {
    await addUserService(user.id, service.id, organisation.id, selectedRoles, req.id);
  }

  await notificationClient.sendServiceRequestApproved(
    user.email,
    user.firstName,
    user.lastName,
    organisation.name,
    service.name,
    roles.map((r) => r.name),
  );

  logger.audit(`${req.user.email} (id: ${req.user.sub}) added service ${service.name} for organisation ${organisation.name} (id: ${model.organisation.id}) for user ${user.email} (id: ${user.id})`, {
    type: 'manage',
    subType: 'user-service-added',
    userId: req.user.sub,
    userEmail: req.user.email,
    organisationId: organisation.id,
    editedFields: [{
      name: 'add_services',
      newValue: {
        id: service.id,
        roles: selectedRoles,
      },
    }],
    editedUser: user.id,
  });

  res.flash('title', 'Success');
  res.flash('heading', `Service added: ${service.name}`);
  res.flash('message', 'Approvers at the relevant organisation have been notified of this change.');

  return res.redirect(`/services/${req.params.sid}/users/${req.params.uid}/organisations`);
};

module.exports = {
  get,
  post,
};
