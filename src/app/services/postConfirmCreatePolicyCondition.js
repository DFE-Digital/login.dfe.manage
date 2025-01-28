const {
  getPolicyById,
  updatePolicyById,
} = require("../../infrastructure/access");

const postConfirmCreatePolicyCondition = async (req, res) => {
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
        condition.value.push(model.value);
      }
    }
  } else {
    policy.conditions.push({
      field: model.condition,
      operator: model.operator,
      value: [model.value],
    });
  }

  await updatePolicyById(req.params.sid, req.params.pid, policy, req.id);
  req.session.createPolicyConditionData = undefined;
  res.flash(
    "info",
    `Policy condition ${model.condition} ${model.operator} ${model.value} successfully added`,
  );

  return res.redirect("conditionsAndRoles");
};

module.exports = postConfirmCreatePolicyCondition;
