const config = require('./../../infrastructure/config');
const logger = require('./../../infrastructure/logger');

const { listRolesOfService } = require('./../../infrastructure/access');
const { createInvite } = require('./../../infrastructure/directories');
const { putUserInOrganisation, putInvitationInOrganisation } = require('./../../infrastructure/organisations');
const { addUserService, addInvitationService } = require('./../../infrastructure/access');

const get = async (req, res) => {
  if (!req.session.user) {
    return res.redirect(`/services/${req.params.sid}/users`)
  }

  const allRolesForService = await listRolesOfService(req.params.sid, req.id);
  const selectedRoleIds = req.session.user.roles;
  const roleDetails = allRolesForService.filter(x => selectedRoleIds.find(y => y.toLowerCase() === x.id.toLowerCase()));


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
  });

};

const post = async (req, res) => {
  if (!req.session.user) {
    return res.redirect(`/services/${req.params.sid}/users`)
  }

  let uid = req.params.uid;
  let isInvitation = false;
  const organisationId = req.session.user.organisationId;

  // new user create invite
  if (!uid) {
    const redirectUri = `${config.hostingEnvironment.servicesUrl}/auth`;
    const invitationId = await createInvite(req.session.user.firstName, req.session.user.lastName, req.session.user.email, 'services', redirectUri, req.id);
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
    }
    //TODO: send email for adding service to existing user
    await addUserService(uid, req.params.sid, organisationId, req.session.user.roles, req.id);
  }

  // TODO: patch search API

  if (isInvitation) {
    // audit invitation
    logger.audit(`${req.user.email} (id: ${req.user.sub}) invited ${req.session.user.email} to ${req.session.user.organisationName} (id: ${organisationId}) (id: ${uid})`, {
      type: 'manage',
      subType: 'user-invited',
      userId: req.user.sub,
      userEmail: req.user.email,
      invitedUserEmail: req.session.user.email,
      invitedUser: uid,
      organisationId: organisationId,
    });

    res.flash('info', `Invitation email sent to ${req.session.user.email}`);
    return res.redirect (`/services/${req.params.sid}/users`);

  } else {
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
    return res.redirect (`/services/${req.params.sid}/users`);
  }
};

module.exports = {
  get,
  post,
};
