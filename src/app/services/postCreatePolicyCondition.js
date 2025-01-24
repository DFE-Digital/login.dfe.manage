const { getPolicyById } = require("../../infrastructure/access");
const { getServiceById } = require("../../infrastructure/applications");

const postCreatePolicyCondition = async (req, res) => {
  const model = {};
  //const model = await validate(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();

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
  }

  // Save 3 fields to the session
  // Redirect to the confirm screen
};

module.exports = postCreatePolicyCondition;
