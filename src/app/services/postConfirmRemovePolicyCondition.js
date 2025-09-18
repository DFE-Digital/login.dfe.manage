const {
  getServicePolicyRaw,
  updateServicePolicyRaw,
} = require("login.dfe.api-client/services");
const logger = require("../../infrastructure/logger");

const postConfirmRemovePolicyCondition = async (req, res) => {
  const condition = req.body.condition;
  const operator = req.body.operator;
  const value = req.body.value;

  const policy = await getServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
  });

  const conditionOperatorAndValueInPolicy = policy.conditions.find(
    (policyCondition) =>
      policyCondition.field === condition &&
      policyCondition.operator === operator &&
      policyCondition.value.includes(value),
  );

  if (conditionOperatorAndValueInPolicy) {
    if (conditionOperatorAndValueInPolicy.value.length === 1) {
      // If only 1 value for condition, remove the whole condition from the policy
      const conditionIndex = policy.conditions.indexOf(
        conditionOperatorAndValueInPolicy,
      );
      policy.conditions.splice(conditionIndex, 1);
    } else {
      // If more than 1 value for condition, remove just that value from the array for that condition
      const index = conditionOperatorAndValueInPolicy.value.indexOf(value);
      conditionOperatorAndValueInPolicy.value.splice(index, 1);
    }
  } else {
    // Very unlikely to ever get to this.  If someone tampered with the hidden values then it's possible.
    logger.info(
      `[${condition}] and [${operator}] and [${value}] not found in existing policy`,
      { correlationId: req.id },
    );
    res.flash(
      "info",
      `Policy condition ${condition} ${operator} ${value} not found in policy. Policy has not been modified`,
    );
    return res.redirect("conditionsAndRoles");
  }

  await updateServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
    policy,
  });

  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) removed a policy condition for service ${req.params.sid} and policy ${req.params.pid}`,
    {
      type: "manage",
      subType: "policy-condition-removed",
      userId: req.user.sub,
      userEmail: req.user.email,
      field: condition,
      operator: operator,
      value: value,
    },
  );

  res.flash(
    "info",
    `Policy condition ${condition} ${operator} ${value} successfully removed`,
  );

  return res.redirect("conditionsAndRoles");
};

module.exports = postConfirmRemovePolicyCondition;
