const { getPolicyById } = require("../../infrastructure/access");
const { getServiceById } = require("../../infrastructure/applications");
const { validate: validateUUID } = require("uuid");
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

  if (model.condition && model.operator && model.value) {
    if (model.condition === "organisation.urn") {
      const urnRegex = /^\d{6}$/i;
      if (!urnRegex.test(model.value)) {
        model.validationMessages.value =
          "organisation.urn can only be a 6 digit number";
      }
    }
    if (model.condition === "organisation.id") {
      if (!validateUUID(model.value)) {
        model.validationMessages.value =
          "organisation.id needs to be a valid uuid";
      }
    }
    if (model.condition === "organisation.type") {
      const typeRegex = /^\d{2}$/i;
      if (!typeRegex.test(model.value)) {
        model.validationMessages.value =
          "organisation.type can only be a 2 digit number";
      }
    }
    if (model.condition === "organisation.status") {
      const statusRegex = /^\d{1,2}$/i;
      if (!statusRegex.test(model.value)) {
        model.validationMessages.value =
          "organisation.status can only be a 1 or 2 digit number";
      }
    }
    if (model.condition === "organisation.category") {
      const categoryRegex = /^\d{3}$/i;
      if (!categoryRegex.test(model.value)) {
        model.validationMessages.value =
          "organisation.category can only be a 3 digit number";
      }
    }
  }

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
    return res.render("services/views/createPolicyCondition", {
      ...model,
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
        ...model,
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
