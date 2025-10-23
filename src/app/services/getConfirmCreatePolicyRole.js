const { getServicePolicyRaw } = require("login.dfe.api-client/services");
const { getUserServiceRoles } = require("./utils");

const getConfirmCreatePolicyRole = async (req, res) => {
  console.log(
    " !!!  getConfirmCreatePolicyRole  !!! ",
    getConfirmCreatePolicyRole,
  );
  if (!req.session.createPolicyRoleData) {
    return res.redirect("conditionsAndRoles");
  }

  const model = req.session.createPolicyRoleData;
  console.log(model);
  const policy = await getServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
  });
  const manageRolesForService = await getUserServiceRoles(req);
  console.log("manageRolesForService: ", manageRolesForService);

  return res.render("services/views/confirmCreatePolicyRole", {
    csrfToken: req.csrfToken(),
    roleName: model.roleName,
    roleCode: model.roleCode,
    // value: model.value,
    policy,
    cancelLink: `/services/${req.params.sid}/policies/${req.params.pid}/create-policy-role`,
    backLink: `/services/${req.params.sid}/policies/${req.params.pid}/create-policy-role`,
    serviceId: req.params.sid,
    currentNavigation: "policies",
    userRoles: manageRolesForService,
  });
};

module.exports = getConfirmCreatePolicyRole;
