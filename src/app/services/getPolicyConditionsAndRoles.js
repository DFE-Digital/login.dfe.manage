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
    condition.mappedValues = [];
    const currentCondition = condition;

    const friendlyValues = await getFriendlyValues(
      condition.field,
      condition.value,
      correlationId,
    );
    currentCondition.friendlyField = getFriendlyFieldName(condition.field);
    for (let i = 0; i < friendlyValues.length; i++) {
      currentCondition.mappedValues.push({
        value: currentCondition.value[i],
        friendlyValue: friendlyValues[i],
      });
    }
  });
};

const getPolicyConditions = async (req, res) => {
  const service = await getServiceById(req.params.sid, req.id);
  const policy = await getPolicyById(req.params.sid, req.params.pid, req.id);
  const manageRolesForService = await getUserServiceRoles(req);
  const canUserModifyPolicyConditions = doesUserHaveRole(
    req,
    "manageModifyPolicyCondition",
  );
  await mapPolicyConstraints(policy, req.id);

  policy.roles.sort((a, b) => a.name.localeCompare(b.name));
  policy.conditions.sort((a, b) =>
    a.friendlyField.localeCompare(b.friendlyField),
  );
  policy.conditions.forEach((conditionType) => {
    const isNumeric =
      conditionType.value.length > 1 && /^[0-9]+$/.test(conditionType.value[0]);
    // Sort on friendly name so they display alphabetically
    conditionType.mappedValues.sort((a, b) =>
      a.friendlyValue.localeCompare(b.friendlyValue, undefined, {
        numeric: isNumeric,
      }),
    );
  });

  return res.render("services/views/policyConditionsAndRoles", {
    csrfToken: req.csrfToken(),
    policy,
    service,
    backLink: `/services/${req.params.sid}/policies`,
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    canUserModifyPolicyConditions,
    currentNavigation: "policies",
  });
};

module.exports = getPolicyConditions;
