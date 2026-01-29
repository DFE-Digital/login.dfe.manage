const { getServicePolicyRaw } = require("login.dfe.api-client/services");
const { getUserServiceRoles } = require("./utils");

const getConfirmRemovePolicy = async (req, res) => {
  const manageRolesForService = await getUserServiceRoles(req);

  const policy = await getServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
  });

  return res.render("services/views/confirmRemovePolicy", {
    csrfToken: req.csrfToken(),
    policy,
    cancelLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    backLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    serviceId: req.params.sid,
    currentNavigation: "policies",
    userRoles: manageRolesForService,
  });
};

module.exports = getConfirmRemovePolicy;
