const { getServicePolicyRaw } = require("login.dfe.api-client/services");
// const {
//   getUserServiceRoles,
//   getFriendlyFieldName,
//   getFriendlyValues,
// } = require("./utils");

const getConfirmRemovePolicyRole = async (req, res) => {
  //?* speak to api-client, will i need to add anything there, maybe not?
  //todo remove the role from the arr and update policy

  const name = req.query.name;
  const code = req.query.code;
  //   const value = req.query.value;
  // code & name & id ??
  const correlationId = req.id;
  //   const manageRolesForService = await getUserServiceRoles(req);

  const policy = await getServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
  });

  //   const friendlyValue = await getFriendlyValues(
  //     condition,
  //     [value],
  //     correlationId,
  //   );
  //   const friendlyField = getFriendlyFieldName(condition);

  return res.render("services/views/confirmRemovePolicyRole", {
    csrfToken: req.csrfToken(),
    // condition,
    // operator,
    // value,
    policy,
    // friendlyField,
    // friendlyValue,
    cancelLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    backLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    serviceId: req.params.sid,
    currentNavigation: "policies",
    // userRoles: manageRolesForService,
  });
};

module.exports = getConfirmRemovePolicyRole;
