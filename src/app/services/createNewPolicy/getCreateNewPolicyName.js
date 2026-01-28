const { getServiceRaw } = require("login.dfe.api-client/services");
const { getUserServiceRoles } = require("../utils");

const getCreateNewPolicyName = async (req, res) => {
  const name = req.session.createNewPolicy?.name || "";
  const service = await getServiceRaw({
    by: { serviceId: req.params.sid },
  });
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render("services/views/createNewPolicyName", {
    csrfToken: req.csrfToken(),
    name,
    validationMessages: {},
    service,
    backLink: `/services/${req.params.sid}/policies`,
    cancelLink: `/services/${req.params.sid}/policies`,
    currentNavigation: "policies",
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
  });
};

module.exports = getCreateNewPolicyName;
