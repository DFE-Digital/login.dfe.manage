const { getPolicyById } = require('../../infrastructure/access');
const { getServiceById } = require('../../infrastructure/applications');
const { getFriendlyFieldName, getFriendlyValues, getUserServiceRoles } = require('./utils');
const { forEachAsync } = require('../../utils/asyncHelpers');

const mapPolicyConstraints = async (policy, correlationId) => {
  await forEachAsync(policy.conditions, async (condition) => {
    condition.value = await getFriendlyValues(condition.field, condition.value, correlationId);
    condition.field = getFriendlyFieldName(condition.field);
  });
};

const getPolicyConditions = async (req, res) => {
  const service = await getServiceById(req.params.sid, req.id);
  const policy = await getPolicyById(req.params.sid, req.params.pid, req.id);
  const manageRolesForService = await getUserServiceRoles(req);
  await mapPolicyConstraints(policy, req.id);

  return res.render('services/views/policyConditionsAndRoles', {
    csrfToken: req.csrfToken(),
    policy,
    service,
    backLink: `/services/${req.params.sid}/policies`,
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentNavigation: 'policies',
  });
};

module.exports = getPolicyConditions;
