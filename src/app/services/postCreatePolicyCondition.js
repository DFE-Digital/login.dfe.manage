const { getServicePolicyRaw } = require("login.dfe.api-client/services");
const { getOrganisationRaw } = require("login.dfe.api-client/organisations");
const { getUserServiceRoles } = require("./utils");
const { validate: validateUUID } = require("uuid");
const logger = require("../../infrastructure/logger");

const validate = async (req, currentPolicyConditions) => {
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
    model.validationMessages.operator = "Please enter an operator";
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
    if (model.condition === "organisation.ukprn") {
      const ukprnRegex = /^\d{8}$/i;
      if (!ukprnRegex.test(model.value)) {
        model.validationMessages.value =
          "organisation.ukprn can only be an 8 digit number";
      }
    }
    if (model.condition === "organisation.id") {
      if (!validateUUID(model.value)) {
        model.validationMessages.value =
          "organisation.id needs to be a valid uuid";
      }
    }
    if (model.condition === "organisation.type.id") {
      const typeRegex = /^\d{2}$/i;
      if (!typeRegex.test(model.value)) {
        model.validationMessages.value =
          "organisation.type.id can only be a 2 digit number";
      }
    }
    if (model.condition === "organisation.status.id") {
      const statusRegex = /^\d{1,2}$/i;
      if (!statusRegex.test(model.value)) {
        model.validationMessages.value =
          "organisation.status.id can only be a 1 or 2 digit number";
      }
    }
    if (model.condition === "organisation.category.id") {
      const categoryRegex = /^\d{3}$/i;
      if (!categoryRegex.test(model.value)) {
        model.validationMessages.value =
          "organisation.category.id can only be a 3 digit number";
      }
    }
    if (model.condition === "organisation.IsOnAPAR") {
      if (model.value !== "YES" && model.value !== "NO") {
        model.validationMessages.value =
          "organisation.IsOnAPAR can only be YES or NO";
      }
    }
    if (model.condition === "organisation.phaseOfEducation.id") {
      const categoryRegex = /^[0-7]$/i;
      if (!categoryRegex.test(model.value)) {
        model.validationMessages.value =
          "organisation.phaseOfEducation.id can only be a number between 0 and 7 inclusive";
      }
    }
    if (model.condition === "organisation.localAuthority.id") {
      const categoryRegex = /^\d{3}$/i;
      if (!categoryRegex.test(model.value)) {
        model.validationMessages.value =
          "organisation.localAuthority.id can only be a 3 digit number";
      }
    }
  }

  // Ensure all 3 fields are populated and have sensible values before doing more
  // thorough validation
  if (Object.keys(model.validationMessages).length > 0) {
    return model;
  }

  for (const condition of currentPolicyConditions) {
    // Find if new value matches any existing values. If the result isn't empty, we have a match.
    const matchingValues = condition.value.filter(
      (value) => value === model.value,
    );

    // All 3 have to match for it to be a duplicate
    if (
      model.condition === condition.field &&
      model.operator === condition.operator &&
      matchingValues.length > 0
    ) {
      model.validationMessages.value = "Duplicate existing policy found";
    }

    // If condition AND value match, but operator is different, then we have a contradiction
    // as we can't have is AND is_not for the same value
    if (
      model.condition === condition.field &&
      model.operator !== condition.operator &&
      matchingValues.length > 0
    ) {
      model.validationMessages.value = "Contradicting policy found";
    }
  }

  if (model.condition === "organisation.id") {
    const organisation = await getOrganisationRaw({
      by: { organisationId: model.value },
    });
    if (!organisation) {
      model.validationMessages.value = "Organisation id does not exist";
    }
  }

  return model;
};

const postCreatePolicyCondition = async (req, res) => {
  const policy = await getServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
  });
  const model = await validate(req, policy.conditions);
  const manageRolesForService = await getUserServiceRoles(req);

  if (Object.keys(model.validationMessages).length > 0) {
    return res.render("services/views/createPolicyCondition", {
      ...model,
      csrfToken: req.csrfToken(),
      policy,
      cancelLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
      backLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
      serviceId: req.params.sid,
      currentNavigation: "policies",
      userRoles: manageRolesForService,
    });
  }

  logger.info(
    "Validation passed.  Saving new policy condition to session for confirmation",
    { correlationId: req.id },
  );
  req.session.createPolicyConditionData = model;
  req.session.save((error) => {
    if (error) {
      // Any error saving to session should hopefully be temporary. Assuming this, we log the error
      // and just display an error message saying to try again.
      logger.error("An error occurred when saving to the session", error);
      model.validationMessages.condition =
        "Something went wrong submitting data, please try again";
      return res.render("services/views/createPolicyCondition", {
        ...model,
        csrfToken: req.csrfToken(),
        policy,
        cancelLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
        backLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
        serviceId: req.params.sid,
        currentNavigation: "policies",
        userRoles: manageRolesForService,
      });
    }
    return res.redirect("confirm-create-policy-condition");
  });
};

module.exports = postCreatePolicyCondition;
