const { getPolicyById } = require('./../../infrastructure/access');
const { getServiceById } = require('./../../infrastructure/applications');
const { getFriendlyFieldName, getFriendlyValues } = require('./utils');
const { forEachAsync } = require('./../../utils/asyncHelpers');

const mapPolicyConstraints = async (policy, correlationId) => {
  await forEachAsync(policy.conditions, async (condition) => {
    condition.value = await getFriendlyValues(condition.field, condition.value, correlationId);
    condition.field = getFriendlyFieldName(condition.field);
  });
};

const getPolicyConditions = async (req, res) => {
  const service = await  getServiceById(req.params.sid, req.id);
  const policy = await getPolicyById(req.params.sid, req.params.pid, req.id);
  const allUserRoles = req.userServices.roles.map((role) => ({
    serviceId: role.code.substr(0, role.code.indexOf('_')),
    role: role.code.substr(role.code.lastIndexOf('_') + 1),
  }));
  const userRolesForService = allUserRoles.filter(x => x.serviceId === req.params.sid);
  const manageRolesForService = userRolesForService.map(x => x.role);
  await mapPolicyConstraints(policy, req.id);

  return res.render('services/views/policyConditions', {
    csrfToken: req.csrfToken(),
    policy,
    service,
    backLink: `/services/${req.params.sid}/policies`,
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentPage: 'policies',
  })
};

module.exports = getPolicyConditions;
