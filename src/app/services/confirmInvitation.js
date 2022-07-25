const NotificationClient = require('login.dfe.notifications.client');
const config = require('../../infrastructure/config');
const logger = require('../../infrastructure/logger');

const { createInvite } = require('../../infrastructure/directories');
const {
  putUserInOrganisation, putInvitationInOrganisation, getOrganisationByIdV2, getPendingRequestsAssociatedWithUser, updateRequestById,
} = require('../../infrastructure/organisations');
const { addUserService, addInvitationService, listRolesOfService } = require('../../infrastructure/access');
const { getSearchDetailsForUserById, updateIndex, createIndex } = require('../../infrastructure/search');
const { waitForIndexToUpdate, getUserServiceRoles } = require('./utils');

const notificationClient = new NotificationClient({
  connectionString: config.notifications.connectionString,
});

const get = async (req, res) => {
  if (!req.session.user) {
    return res.redirect(`/services/${req.params.sid}/users`);
  }

  const allRolesForService = await listRolesOfService(req.params.sid, req.id);
  const selectedRoleIds = req.session.user.roles || [];
  const roleDetails = allRolesForService.filter((x) => selectedRoleIds.find((y) => y.toLowerCase() === x.id.toLowerCase()));
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render('services/views/confirmInvitation', {
    csrfToken: req.csrfToken(),
    backLink: true,
    cancelLink: `/services/${req.params.sid}/users`,
    user: {
      firstName: req.session.user.firstName,
      lastName: req.session.user.lastName,
      email: req.session.user.email,
      isExistingUser: req.params.uid,
    },
    organisation: {
      name: req.session.user.organisationName,
      permissionLevel: req.session.user.permission === 10000 ? 'Approver' : 'End user',
    },
    service: {
      name: req.session.user.service,
      roles: roleDetails,
    },
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentNavigation: 'users',
  });
};

const post = async (req, res) => {
  if (!req.session.user) {
    return res.redirect(`/services/${req.params.sid}/users`);
  }

  let { uid } = req.params;
  let isInvitation = false;
  const { organisationId } = req.session.user;

  // new user create invite
  if (!uid) {
    const redirectUri = `${config.hostingEnvironment.servicesUrl}/auth`;
    const isApprover = req.session.user.permission === 10000;
    const invitationId = await createInvite(req.session.user.firstName, req.session.user.lastName, req.session.user.email, 'services', redirectUri, req.id, isApprover, req.session.user.organisationName);
    uid = `inv-${invitationId}`;
    isInvitation = true;
  }

  if (uid.startsWith('inv-')) {
    const invitationId = uid.substr(4);

    if (!req.session.user.existingOrg) {
      // put inv in org
      await putInvitationInOrganisation(invitationId, organisationId, req.session.user.permission, req.id);
    }
    await addInvitationService(invitationId, req.params.sid, organisationId, req.session.user.roles, req.id);
  } else {
    // put user in org
    if (!req.session.user.existingOrg) {
      await putUserInOrganisation(uid, organisationId, req.session.user.permission, req.id);
      const pendingOrgRequests = await getPendingRequestsAssociatedWithUser(uid, req.id);
      const requestForOrg = pendingOrgRequests ? pendingOrgRequests.find((x) => x.org_id === organisationId) : null;
      if (requestForOrg) {
        // mark request as approved if outstanding for same org
        await updateRequestById(requestForOrg.id, 1, req.user.sub, null, Date.now(), req.id);
      }
    }

    const allRolesForService = await listRolesOfService(req.params.sid, req.id);
    const selectedRoleIds = req.session.user.roles;
    const roleDetails = allRolesForService.filter((x) => selectedRoleIds.find((y) => y.toLowerCase() === x.id.toLowerCase()));

    await addUserService(uid, req.params.sid, organisationId, req.session.user.roles, req.id);
    await notificationClient.sendServiceRequestApproved(
      req.session.user.email,
      req.session.user.firstName,
      req.session.user.lastName,
      req.session.user.organisationName,
      req.session.user.service,
      roleDetails.map((i) => i.name),
    );
  }

  // audit invitation
  logger.audit(`${req.user.email} (id: ${req.user.sub}) invited ${req.session.user.email} to ${req.session.user.organisationName} (id: ${organisationId}) (id: ${uid})`, {
    type: 'manage',
    subType: 'user-invited',
    userId: req.user.sub,
    userEmail: req.user.email,
    invitedUserEmail: req.session.user.email,
    invitedUser: uid,
    organisationId,
  });

  if (isInvitation) {
    await createIndex(`${uid}`, req.id);
    await waitForIndexToUpdate(uid);

    res.flash('info', `Invitation email sent to ${req.session.user.email}`);
    return res.redirect(`/services/${req.params.sid}/users`);
  }
  // patch search api
  const getUserDetails = await getSearchDetailsForUserById(uid, req.id);
  if (!getUserDetails) {
    logger.error(`Failed to find user ${uid} when confirming change of user permissions`, { correlationId: req.id });
  } else {
    if (!req.session.user.existingOrg) {
      // patch search api with users new org
      const organisation = await getOrganisationByIdV2(organisationId, req.id);
      const currentUserOrgDetails = getUserDetails.organisations || [];
      const newOrg = {
        id: organisation.id,
        name: organisation.name,
        urn: organisation.urn || undefined,
        uid: organisation.uid || undefined,
        establishmentNumber: organisation.establishmentNumber || undefined,
        laNumber: organisation.localAuthority ? organisation.localAuthority.code : undefined,
        categoryId: organisation.category.id,
        statusId: organisation.status.id,
        roleId: req.session.user.permission || 0,
      };
      currentUserOrgDetails.push(newOrg);
      await updateIndex(uid, { organisations: currentUserOrgDetails }, req.id);
      await waitForIndexToUpdate(uid, (updated) => updated.organisations.length === currentUserOrgDetails.length);
    }
    // patch search api with users new service
    const currentUserServices = getUserDetails.services || [];
    currentUserServices.push(req.params.sid);
    await updateIndex(uid, { services: currentUserServices }, req.id);
    await waitForIndexToUpdate(uid, (updated) => updated.services.length === currentUserServices.length);
  }

  // audit add service to user
  logger.audit(`${req.user.email} (id: ${req.user.sub}) added services for organisation ${req.session.user.organisationName} (id: ${organisationId}) for user ${req.session.user.email} (id: ${uid})`, {
    type: 'manage',
    subType: 'user-services-added',
    userId: req.user.sub,
    userEmail: req.user.email,
    editedUser: uid,
    editedFields: [{
      name: 'add_services',
      newValue: {
        id: req.params.sid,
        roles: req.session.user.roles,
      },
    }],
  });
  res.flash('info', `${req.session.user.service} added to ${req.session.user.firstName} ${req.session.user.lastName} at ${req.session.user.organisationName}`);
  return res.redirect(`/services/${req.params.sid}/users`);
};

module.exports = {
  get,
  post,
};
