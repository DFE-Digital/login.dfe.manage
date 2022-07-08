const { emailPolicy } = require('login.dfe.validation');
const { getUserDetails, waitForIndexToUpdate, getUserServiceRoles } = require('./utils');
const {
  getUserById, getInvitationByEmail, resendInvitation, updateInvite,
} = require('../../infrastructure/directories');
const { updateIndex } = require('../../infrastructure/search');
const logger = require('../../infrastructure/logger');

const get = async (req, res) => {
  const user = await getUserDetails(req);
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render('services/views/confirmResendInvitation', {
    backLink: true,
    csrfToken: req.csrfToken(),
    user,
    email: user.email,
    validationMessages: {},
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentNavigation: 'users',
  });
};

const validate = async (req) => {
  const user = await getUserDetails(req);

  const model = {
    backLink: true,
    user,
    noChangedEmail: false,
    email: req.body.email.trim() || '',
    validationMessages: {},
  };

  if (model.email === model.user.email) {
    model.noChangedEmail = true;
    return model;
  }

  if (!model.email) {
    model.validationMessages.email = 'Please enter an email address';
  } else if (!emailPolicy.doesEmailMeetPolicy(model.email)) {
    model.validationMessages.email = 'Please enter a valid email address';
  } else {
    const existingUser = await getUserById(model.email, req.id);
    const existingInvitation = await getInvitationByEmail(model.email, req.id);
    if (existingUser || existingInvitation) {
      model.validationMessages.email = 'A DfE Sign-in user already exists with that email address';
    }
  }

  return model;
};

const post = async (req, res) => {
  const model = await validate(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render('services/views/confirmResendInvitation', model);
  }

  if (model.noChangedEmail) {
    await resendInvitation(req.params.uid.substr(4), req.id);
  } else {
    await updateInvite(req.params.uid.substr(4), model.email, req.id);
    await updateIndex(req.params.uid, { email: model.email }, req.id);
    await waitForIndexToUpdate(req.params.uid, (updated) => (updated ? updated.email : '') === model.email);
  }

  logger.audit(`${req.user.email} (id: ${req.user.sub}) resent invitation email to  ${model.email} (id: ${req.params.uid})`, {
    type: 'manage',
    subType: 'resent-invitation',
    userId: req.user.sub,
    userEmail: req.user.email,
    invitedUserEmail: model.email,
    invitedUser: req.params.uid,
  });

  res.flash('info', `Invitation email sent to ${model.email}`);
  return res.redirect(`/services/${req.params.sid}/users/${req.params.uid}/organisations`);
};

module.exports = {
  get,
  post,
};
