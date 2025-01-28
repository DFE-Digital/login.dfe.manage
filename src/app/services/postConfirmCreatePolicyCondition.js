const {
  getPolicyById,
  updatePolicyById,
} = require("../../infrastructure/access");

const postConfirmCreatePolicyCondition = async (req, res) => {
  const model = req.session.createPolicyConditionData;
  const policy = await getPolicyById(req.params.sid, req.params.pid, req.id);

  // push new condition to condition list (either new row if new, or modify existing if condition already exists)

  // if (conditionInPolicy) {
  // TODO handle case if condition already exists
  // } else {
  // If condition isn't in policy, simply push new object to array
  policy.conditions.push({
    field: model.condition,
    operator: model.operator,
    value: [model.value],
  });
  // }

  // call function that calls services/id/policies/id api endpoint in access
  await updatePolicyById(req.params.sid, req.params.pid, policy, req.id);
  req.session.createPolicyConditionData = undefined;
  // flash success banner

  return res.redirect("conditionsAndRoles");
};

module.exports = postConfirmCreatePolicyCondition;
