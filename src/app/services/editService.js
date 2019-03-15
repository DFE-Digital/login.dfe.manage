const config = require('./../../infrastructure/config');
const { getSingleUserService, getSingleInvitationService } = require('./../../infrastructure/access');
const { getServiceById } = require('./../../infrastructure/applications');
const { getUserDetails } = require('./utils');
const { getOrganisationByIdV2 } = require('./../../infrastructure/organisations');

const PolicyEngine = require('login.dfe.policy-engine');
const policyEngine = new PolicyEngine(config);

const getSingleServiceForUser = async (userId, organisationId, serviceId, correlationId) => {
  const userService = userId.startsWith('inv-') ? await getSingleInvitationService(userId.substr(4), serviceId, organisationId, correlationId) :
    await getSingleUserService(userId, serviceId, organisationId, correlationId);
  const application = await getServiceById(userService.serviceId);
  return {
    id: userService.serviceId,
    roles: userService.roles,
    name: application.name,
  }
};

const getViewModel = async (req) => {
  const user = await getUserDetails(req);
  const organisation = await getOrganisationByIdV2(req.params.oid, req.id);
  const userService = await  getSingleServiceForUser(req.params.uid, req.params.oid, req.params.sid, req.id);
  const policyResult = await policyEngine.getPolicyApplicationResultsForUser(req.params.uid.startsWith('inv-') ? undefined : req.params.uid, req.params.oid, req.params.sid, req.id);
  const serviceRoles = policyResult.rolesAvailableToUser;

  return {
    csrfToken: req.csrfToken(),
    service: userService,
    serviceRoles,
    selectedRoles: [],
    user,
    backLink: true,
    organisation,
  };
};

const get = async (req, res) => {
  const model = await getViewModel(req);
  if (req.session.service) {
    model.selectedRoles = req.session.service.roles;
  }
  return res.render('services/views/editService', model);
};

const post = async (req, res) => {
  const selectedRoles = req.body.role;
  const model = await getViewModel(req);

  const uid = req.params.uid && !req.params.uid.startsWith('inv-') ? req.params.uid : undefined;
  const policyValidationResult = await policyEngine.validate(uid, req.params.oid, req.params.sid, selectedRoles, req.id);
  if (policyValidationResult.length > 0) {
    model.validationMessages.roles = policyValidationResult.map(x => x.message);
    return res.render('services/views/editService');
  }

  req.session.service = {
    roles: selectedRoles
  };
  return res.redirect(`${model.organisation.id}/confirm-edit-service`)
};

module.exports = {
  get,
  post,
};
