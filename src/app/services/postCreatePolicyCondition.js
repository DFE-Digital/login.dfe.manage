const { getPolicyById } = require("../../infrastructure/access");
const { getServiceById } = require("../../infrastructure/applications");
//const logger = require("./infrastructure/logger");

const validate = async (req) => {
  const model = {
    condition: req.body.condition || "",
    operator: req.body.operator || "",
    value: req.body.value || "",
    validationMessages: {},
  };

  if (!model.condition) {
    model.validationMessages.condition = "Please enter a condition";
  }

  if (!model.operator) {
    model.validationMessages.operator = "Please enter a operator";
  }

  if (!model.value) {
    model.validationMessages.value = "Please enter a value";
  }
  // TODO depending on condition, the validation changes
  // if condition = organisation.id, value must be a uuid
  // if condition = organisation.status
  // if condition = organisation.urn
  // if condition = organisation.type
  // if condition = organisation.category

  // TODO Look at current policy and ensure added policy isn't a duplicate
  // TODO check added policy doesn't contradict current policy (e.g., adding is and is not for same condition and value)
  // TODO? If condition is id then check that organisation exists

  return model;
};

const postCreatePolicyCondition = async (req, res) => {
  const model = await validate(req);
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

  req.session.createPolicyConditionData = model;
  req.session.save((error) => {
    if (error) {
      // Any error saving to session should hopefully be temporary. Assuming this, we log the error
      // and just display an error message saying to try again.
      //logger.error('An error occurred when saving to the session', error);
      model.validationMessages.condition =
        "Something went wrong submitting data, please try again";
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
    return res.redirect("confirm-create-policy-condition");
  });
};

module.exports = postCreatePolicyCondition;
