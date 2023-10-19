const PolicyEngine = require('login.dfe.policy-engine');
const config = require('../../infrastructure/config');
const { getServiceById } = require('../../infrastructure/applications');
const { getUserDetails, getUserServiceRoles } = require('./utils');
const { getOrganisationByIdV2 } = require('../../infrastructure/organisations');

const policyEngine = new PolicyEngine(config);

const getViewModel = async (req) => {
  const user = await getUserDetails(req);
  const organisation = await getOrganisationByIdV2(req.params.oid, req.id);
  const service = await getServiceById(req.params.sid);
  const policyResult = await policyEngine.getPolicyApplicationResultsForUser(req.params.uid.startsWith('inv-') ? undefined : req.params.uid, req.params.oid, req.params.sid, req.id);
  const serviceRoles = policyResult.rolesAvailableToUser;
  const manageRolesForService = await getUserServiceRoles(req);
  let links = '';

  if(req.params.currentIod === undefined){
    links = `/services/${req.params.sid}/users/${req.params.uid}/organisations`;
  }else{
    links = `/services/${req.params.sid}/users/${req.params.uid}/organisations/${req.params.currentIod}/userDetails`;
  }

  return {
    csrfToken: req.csrfToken(),
    cancelLink: links,
    service,
    serviceRoles,
    selectedRoles: [],
    user,
    backLink: links,
    organisation,
    validationMessages: {},
    serviceId: req.params.sid,
    organisationId: req.params.currentIod,
    userRoles: manageRolesForService,
    currentNavigation: 'users',
  };
};

const get = async (req, res) => {
  const model = await getViewModel(req);
  return res.render('services/views/associateService', model);
};

const post = async (req, res) => {
  let selectedRoles = req.body.role ? req.body.role : [];
  if (!(selectedRoles instanceof Array)) {
    selectedRoles = [req.body.role];
  }

  const uid = req.params.uid && !req.params.uid.startsWith('inv-') ? req.params.uid : undefined;
  const policyValidationResult = await policyEngine.validate(uid, req.params.oid, req.params.sid, selectedRoles, req.id);
  if (policyValidationResult.length > 0) {
    const model = await getViewModel(req);
    const roles = {};
    model.service.roles = selectedRoles.map((x) => {
      roles[x] = { id: x };
      return roles;
    });
    model.validationMessages.roles = policyValidationResult.map((x) => x.message);
    return res.render('services/views/associateService', model);
  }

  req.session.service = {
    roles: selectedRoles,
  };

  return res.redirect('confirm-associate-service');
};

module.exports = {
  get,
  post,
};
