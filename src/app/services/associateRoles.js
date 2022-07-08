const PolicyEngine = require('login.dfe.policy-engine');
const config = require('../../infrastructure/config');

const policyEngine = new PolicyEngine(config);
const { getOrganisationForUserV2 } = require('../../infrastructure/organisations');
const { getUserServiceRoles } = require('./utils');

const getViewModel = async (req) => {
  const { organisationId } = req.session.user;
  const userOrganisations = (req.params.uid && !req.params.uid.startsWith('inv-')) ? await getOrganisationForUserV2(req.params.uid, req.id) : undefined;
  const userAccessToSpecifiedOrganisation = userOrganisations ? userOrganisations.find((x) => x.organisation.id.toLowerCase() === organisationId.toLowerCase()) : undefined;
  const policyResult = await policyEngine.getPolicyApplicationResultsForUser(userAccessToSpecifiedOrganisation ? req.params.uid : undefined, organisationId, req.params.sid, req.id);

  const serviceRoles = policyResult.rolesAvailableToUser;
  const manageRolesForService = await getUserServiceRoles(req);

  return {
    csrfToken: req.csrfToken(),
    backLink: true,
    cancelLink: `/services/${req.params.sid}/users`,
    service: req.session.user.service || '',
    serviceRoles,
    selectedRoles: req.session.user.roles ? req.session.user.roles : [],
    user: `${req.session.user.firstName} ${req.session.user.lastName}`,
    organisation: req.session.user.organisationName,
    validationMessages: {},
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentNavigation: 'users',
  };
};

const get = async (req, res) => {
  if (!req.session.user) {
    return res.redirect(`/services/${req.params.sid}/users`);
  }

  const model = await getViewModel(req);

  return res.render('services/views/associateRoles', model);
};

const post = async (req, res) => {
  if (!req.session.user) {
    return res.redirect(`/services/${req.params.sid}/users`);
  }

  let selectedRoles = req.body.role ? req.body.role : [];
  if (!(selectedRoles instanceof Array)) {
    selectedRoles = [req.body.role];
  }

  const { organisationId } = req.session.user;
  const userOrganisations = (req.params.uid && !req.params.uid.startsWith('inv-')) ? await getOrganisationForUserV2(req.params.uid, req.id) : undefined;
  const userAccessToSpecifiedOrganisation = userOrganisations ? userOrganisations.find((x) => x.organisation.id.toLowerCase() === organisationId.toLowerCase()) : undefined;
  const policyValidationResult = await policyEngine.validate(userAccessToSpecifiedOrganisation ? req.params.uid : undefined, organisationId, req.params.sid, selectedRoles, req.id);

  req.session.user.roles = selectedRoles;

  if (policyValidationResult.length > 0) {
    const model = await getViewModel(req);
    model.validationMessages.roles = policyValidationResult.map((x) => x.message);
    return res.render('services/views/associateRoles', model);
  }

  return res.redirect(req.params.uid ? 'confirm-details' : 'confirm-new-user');
};

module.exports = {
  get,
  post,
};
