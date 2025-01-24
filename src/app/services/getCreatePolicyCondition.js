const { getPolicyById } = require("../../infrastructure/access");
const { getServiceById } = require("../../infrastructure/applications");

const getCreatePolicyCondition = async (req, res) => {
  const service = await getServiceById(req.params.sid, req.id);
  const policy = await getPolicyById(req.params.sid, req.params.pid, req.id);

  return res.render("services/views/createPolicyCondition", {
    validationMessages: {},
    csrfToken: req.csrfToken(),
    policy,
    service,
    backLink: `/services/${req.params.sid}/policies`,
    serviceId: req.params.sid,
    policyId: policy.id,
    currentNavigation: "policies",
  });
};

module.exports = getCreatePolicyCondition;
