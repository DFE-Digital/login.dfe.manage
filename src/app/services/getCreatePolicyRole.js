const { getUserServiceRoles } = require("./utils");
const { getServicePolicyRaw } = require("login.dfe.api-client/services");

const getCreatePolicyRole = async (req, res) => {
  console.log("!!! getCreatePolicyRole !!!", getCreatePolicyRole);
  const policy = await getServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
  });
  console.log("policy", policy);
  const manageRolesForService = await getUserServiceRoles(req);
  console.log("manageRolesForService: ", manageRolesForService);

  return res.render("services/views/createPolicyRole", {
    validationMessages: {},
    csrfToken: req.csrfToken(),
    policy,
    cancelLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    backLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    serviceId: req.params.sid,
    currentNavigation: "policies",
    userRoles: manageRolesForService,
  });
};

module.exports = getCreatePolicyRole;
