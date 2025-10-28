const { getServicePolicyRaw } = require("login.dfe.api-client/services");
// const {
//   getUserServiceRoles,
//   getFriendlyFieldName,
//   getFriendlyValues,
// } = require("./utils");

const getConfirmRemovePolicyRole = async (req, res) => {
  const name = req.query.name;
  const code = req.query.code;
  const policy = await getServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
  });

  return res.render("services/views/confirmRemovePolicyRole", {
    csrfToken: req.csrfToken(),
    name,
    code,
    policy,
    cancelLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    backLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    serviceId: req.params.sid,
    currentNavigation: "policies",
  });
};

module.exports = getConfirmRemovePolicyRole;
