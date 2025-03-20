const { getPolicyById } = require("../../infrastructure/access");
const { getServiceById } = require("../../infrastructure/applications");
const {
  doesUserHaveRole,
  getFriendlyFieldName,
  getFriendlyValues,
  getUserServiceRoles,
} = require("./utils");
const { forEachAsync } = require("../../utils/asyncHelpers");

const mapPolicyConstraints = async (policy, correlationId) => {
  await forEachAsync(policy.conditions, async (condition) => {
    const currentCondition = condition;
    currentCondition.friendlyValue = await getFriendlyValues(
      condition.field,
      condition.value,
      correlationId,
    );
    currentCondition.friendlyField = getFriendlyFieldName(condition.field);
  });
};

const getPolicyConditions = async (req, res) => {
  const service = await getServiceById(req.params.sid, req.id);
  const policy = await getPolicyById(req.params.sid, req.params.pid, req.id);
  const manageRolesForService = await getUserServiceRoles(req);
  const canUserAddPolicyConditions = doesUserHaveRole(
    req,
    "manageAddPolicyCondition",
  );
  await mapPolicyConstraints(policy, req.id);
  console.log(policy.conditions);

  policy.roles.sort((a, b) => a.name.localeCompare(b.name));
  policy.conditions.sort((a, b) => a.field.localeCompare(b.field));
  policy.conditions.forEach((conditionType) => {
    const isNumeric =
      conditionType.value.length > 1 && /^[0-9]+$/.test(conditionType.value[0]);
    conditionType.value.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: isNumeric }),
    );
  });

  return res.render("services/views/policyConditionsAndRoles", {
    csrfToken: req.csrfToken(),
    policy,
    service,
    backLink: `/services/${req.params.sid}/policies`,
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    canUserAddPolicyConditions,
    currentNavigation: "policies",
  });
};

module.exports = getPolicyConditions;
