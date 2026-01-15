const { getServiceRaw } = require("login.dfe.api-client/services");
const { getUserServiceRoles } = require("../utils");

const getCreateNewPolicyRole = async (req, res) => {
  if (!req.session.createNewPolicy) {
    return res.redirect(`/services/${req.params.sid}/policies`);
  }
  const model = req.session.createNewPolicy;
  const service = await getServiceRaw({
    by: { serviceId: req.params.sid },
  });
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render("services/views/createNewPolicyRole", {
    csrfToken: req.csrfToken(),
    policyName: req.session.createNewPolicy.name,
    roleName: model.role?.roleName,
    roleCode: model.role?.roleCode,
    validationMessages: {},
    service,
    backLink: `/services/${req.params.sid}/policies/create-new-policy-name`,
    cancelLink: `/services/${req.params.sid}/policies`,
    currentNavigation: "policies",
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
  });
};

module.exports = getCreateNewPolicyRole;
