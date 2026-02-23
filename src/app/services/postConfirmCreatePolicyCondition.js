const {
  getServicePolicyRaw,
  updateServicePolicyRaw,
} = require("login.dfe.api-client/services");
const logger = require("../../infrastructure/logger");

const postConfirmCreatePolicyCondition = async (req, res) => {
  const model = req.session.createPolicyConditionData;
  const policy = await getServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
  });
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

  await updateServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
    policy,
  });

  logger.audit(
    `${req.user.email} added '${model.condition}' policy condition`,
    {
      type: "manage",
      subType: "policy-condition-added",
      userId: req.user.sub,
      userEmail: req.user.email,
      serviceId: req.params.sid,
      policyId: req.params.pid,
      field: model.condition,
      operator: model.operator,
      value: model.value,
    },
  );

  req.session.createPolicyConditionData = undefined;
  res.flash(
    "info",
    `Policy condition ${model.condition} ${model.operator} ${model.value} successfully added`,
  );

  return res.redirect("conditionsAndRoles");
};

module.exports = postConfirmCreatePolicyCondition;
