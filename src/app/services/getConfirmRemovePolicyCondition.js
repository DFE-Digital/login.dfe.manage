const { getPolicyById } = require("../../infrastructure/access");
const { getUserServiceRoles } = require("./utils");

const getConfirmRemovePolicyCondition = async (req, res) => {
  const condition = req.query.condition;
  const operator = req.query.operator;
  const value = req.query.value;
  // TODO redirect if user doesn't have correct role
  // if (!req.session.createPolicyConditionData) {
  //   return res.redirect("conditionsAndRoles");
  // }

  const policy = await getPolicyById(req.params.sid, req.params.pid, req.id);
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render("services/views/confirmRemovePolicyCondition", {
    csrfToken: req.csrfToken(),
    condition,
    operator,
    value,
    policy,
    cancelLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    backLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    currentNavigation: "policies",
    userRoles: manageRolesForService,
  });
};

module.exports = getConfirmRemovePolicyCondition;
