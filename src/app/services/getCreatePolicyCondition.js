const { getUserServiceRoles } = require("./utils");
const { getServicePolicyRaw } = require("login.dfe.api-client/services");

const getCreatePolicyCondition = async (req, res) => {
  const policy = await getServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
  });
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render("services/views/createPolicyCondition", {
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

module.exports = getCreatePolicyCondition;
