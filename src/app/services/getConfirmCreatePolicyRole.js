const { getServicePolicyRaw } = require("login.dfe.api-client/services");
const { getUserServiceRoles } = require("./utils");

const getConfirmCreatePolicyRole = async (req, res) => {
  if (!req.session.createPolicyRoleData) {
    return res.redirect("conditionsAndRoles");
  }

  const model = req.session.createPolicyRoleData;
  const policy = await getServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
  });
  const manageRolesForService = await getUserServiceRoles(req);
  console.log("manageRolesForService: ", manageRolesForService);

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

module.exports = getConfirmCreatePolicyRole;
