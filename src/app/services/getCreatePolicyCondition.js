const { getPolicyById } = require("../../infrastructure/access");
const { getUserServiceRoles } = require("./utils");

const getCreatePolicyCondition = async (req, res) => {
  const policy = await getPolicyById(req.params.sid, req.params.pid, req.id);
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render("services/views/createPolicyCondition", {
    validationMessages: {},
    csrfToken: req.csrfToken(),
    policy,
    cancelLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    backLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    currentNavigation: "policies",
    userRoles: manageRolesForService,
  });
};

module.exports = getCreatePolicyCondition;
