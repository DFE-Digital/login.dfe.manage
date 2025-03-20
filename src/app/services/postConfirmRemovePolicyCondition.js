const {
  getPolicyById,
  updatePolicyById,
} = require("../../infrastructure/access");
const logger = require("../../infrastructure/logger");

const postConfirmRemovePolicyCondition = async (req, res) => {
  const model = req.session.createPolicyConditionData;
  const policy = await getPolicyById(req.params.sid, req.params.pid, req.id);
  const conditionAndOperatorInPolicy = policy.conditions.find(
    (condition) =>
      condition.field === model.condition &&
      condition.operator === model.operator,
  );

  if (conditionAndOperatorInPolicy) {
    // Add value to existing field if field and operator already present
    for (const condition of policy.conditions) {
      if (
        condition.field === model.condition &&
        condition.operator === model.operator
      ) {
        logger.info(
          `[${model.condition}] and [${model.operator}] found in policy, pushing value into existing condition`,
          { correlationId: req.id },
        );
        condition.value.push(model.value);
      }
    }
  } else {
    logger.info(
      `[${model.condition}] and [${model.operator}] not found in policy, pushing new record to array`,
      { correlationId: req.id },
    );
    policy.conditions.push({
      field: model.condition,
      operator: model.operator,
      value: [model.value],
    });
  }

  await updatePolicyById(req.params.sid, req.params.pid, policy, req.id);

  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) removed a policy condition for service ${req.params.sid} and policy ${req.params.pid}`,
    {
      type: "manage",
      subType: "policy-condition-removed",
      userId: req.user.sub,
      userEmail: req.user.email,
      field: model.condition,
      operator: model.operator,
      value: model.value,
    },
  );

  res.flash(
    "info",
    `Policy condition ${model.condition} ${model.operator} ${model.value} successfully removed`,
  );

  return res.redirect("conditionsAndRoles");
};

module.exports = postConfirmRemovePolicyCondition;
