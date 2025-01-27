const {
  getPolicyById,
  updatePolicyById,
} = require("../../infrastructure/access");

const postConfirmCreatePolicyCondition = async (req, res) => {
  const model = req.session.createPolicyConditionData;
  const policy = await getPolicyById(req.params.sid, req.params.pid, req.id);

  policy.conditions.push({
    field: model.condition,
    operator: model.operator,
    value: [model.value],
  });
  // console.log(policy)
  // console.log(policy.conditions)

  // push new condition to condition list (either new row if new, or modify existing if condition already exists)

  // call function that calls services/id/policies/id api endpoint in access
  // await updatePolicyById(req.params.sid, req.params.pid, policy, req.id);
  req.session.createPolicyConditionData = undefined;
  // Clean session data

  return res.redirect("conditionsAndRoles");
};

module.exports = postConfirmCreatePolicyCondition;
