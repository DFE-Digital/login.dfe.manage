const { getServicePolicyRaw } = require("login.dfe.api-client/services");

const getCreatePolicyRole = async (req, res) => {
  const policy = await getServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
  });

  return res.render("services/views/createPolicyRole", {
    validationMessages: {},
    csrfToken: req.csrfToken(),
    policy,
    cancelLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    backLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    serviceId: req.params.sid,
    currentNavigation: "policies",
  });
};

module.exports = getCreatePolicyRole;
