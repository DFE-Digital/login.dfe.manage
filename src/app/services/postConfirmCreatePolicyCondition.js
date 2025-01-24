const { getPolicyById } = require("../../infrastructure/access");
const { getServiceById } = require("../../infrastructure/applications");

const postConfirmCreatePolicyCondition = async (req, res) => {
  const model = {};
  const service = await getServiceById(req.params.sid, req.id);
  const policy = await getPolicyById(req.params.sid, req.params.pid, req.id);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();

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
  }

  // TODO save it
  // Clean session data

  return res.redirect("confirm-create-policy-condition");
};

module.exports = postConfirmCreatePolicyCondition;
