const { getPolicyById } = require("../../infrastructure/access");
const { getUserServiceRoles } = require("./utils");

const getConfirmCreatePolicyCondition = async (req, res) => {
  if (!req.session.createPolicyConditionData) {
    return res.redirect("conditionsAndRoles");
  }

  const model = req.session.createPolicyConditionData;
  const policy = await getPolicyById(req.params.sid, req.params.pid, req.id);
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render("services/views/confirmCreatePolicyCondition", {
    csrfToken: req.csrfToken(),
    condition: model.condition,
    operator: model.operator,
    value: model.value,
    policy,
    cancelLink: `/services/${req.params.sid}/policies/${req.params.pid}/create-policy-condition`,
    backLink: `/services/${req.params.sid}/policies/${req.params.pid}/create-policy-condition`,
    currentNavigation: "policies",
    userRoles: manageRolesForService,
  });
};

module.exports = getConfirmCreatePolicyCondition;
