const { getServicePolicyRaw } = require("login.dfe.api-client/services");

const getConfirmCreatePolicyRole = async (req, res) => {
  if (!req.session.createPolicyRoleData) {
    return res.redirect("conditionsAndRoles");
  }

  const model = req.session.createPolicyRoleData;
  const policy = await getServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
  });

  return res.render("services/views/confirmCreatePolicyRole", {
    csrfToken: req.csrfToken(),
    roleName: model.roleName,
    roleCode: model.roleCode,
    policy,
    cancelLink: `/services/${req.params.sid}/policies/${req.params.pid}/create-policy-role`,
    backLink: `/services/${req.params.sid}/policies/${req.params.pid}/create-policy-role`,
    serviceId: req.params.sid,
    currentNavigation: "policies",
  });
};

module.exports = getConfirmCreatePolicyRole;
