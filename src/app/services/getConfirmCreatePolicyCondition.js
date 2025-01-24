const { getPolicyById } = require("../../infrastructure/access");
const { getServiceById } = require("../../infrastructure/applications");

const getConfirmCreatePolicyCondition = async (req, res) => {
  // Get values out of session
  const service = await getServiceById(req.params.sid, req.id);
  const policy = await getPolicyById(req.params.sid, req.params.pid, req.id);

  return res.render("services/views/confirmCreatePolicyCondition", {
    validationMessages: {},
    csrfToken: req.csrfToken(),
    policy,
    service,
    backLink: `/services/${req.params.sid}/policies`,
    currentNavigation: "policies",
  });
};

module.exports = getConfirmCreatePolicyCondition;
