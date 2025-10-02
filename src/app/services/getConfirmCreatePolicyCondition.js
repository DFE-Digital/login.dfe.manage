const { getServicePolicyRaw } = require("login.dfe.api-client/services");
const { getUserServiceRoles } = require("./utils");

const getConfirmCreatePolicyCondition = async (req, res) => {
  if (!req.session.createPolicyConditionData) {
    return res.redirect("conditionsAndRoles");
  }

  const model = req.session.createPolicyConditionData;
  const policy = await getServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
  });
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render("services/views/confirmCreatePolicyCondition", {
    csrfToken: req.csrfToken(),
    condition: model.condition,
    operator: model.operator,
    value: model.value,
    policy,
    cancelLink: `/services/${req.params.sid}/policies/${req.params.pid}/create-policy-condition`,
    backLink: `/services/${req.params.sid}/policies/${req.params.pid}/create-policy-condition`,
    serviceId: req.params.sid,
    currentNavigation: "policies",
    userRoles: manageRolesForService,
  });
};

module.exports = getConfirmCreatePolicyCondition;
