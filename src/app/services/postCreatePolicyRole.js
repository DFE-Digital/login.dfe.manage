const { getServicePolicyRaw } = require("login.dfe.api-client/services");
const logger = require("../../infrastructure/logger");

const validate = async (req) => {
  const model = {
    appId: req.params.sid || "",
    roleName: req.body.roleName.trim() || "",
    roleCode: req.body.roleCode.trim() || "",
    validationMessages: {},
  };

  if (!model.roleName) {
    model.validationMessages.roleName = "Please enter a role name";
  }

  if (!model.roleCode) {
    model.validationMessages.roleCode = "Please enter a role code";
  }

  if (model.roleName.length > 125) {
    model.validationMessages.roleName =
      "Role name must be 125 characters or less";
  }

  if (model.roleCode.length > 50) {
    model.validationMessages.roleCode =
      "Role code must be 50 characters or less";
  }

  const policy = await getServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
  });

  const existingRoleInPolicy = policy.roles.find(
    (role) => role.code === model.roleCode,
  );

  if (existingRoleInPolicy) {
    model.validationMessages.roleExists = `Role with code: ${model.roleCode} already exists for this policy`;
    logger.info(
      `${model.roleName}: [code: ${model.roleCode}] found in policy`,
      { correlationId: req.id },
    );
  }

  return model;
};

const postCreatePolicyRole = async (req, res) => {
  const policy = await getServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
  });
  const model = await validate(req);

  if (Object.keys(model.validationMessages).length > 0) {
    return res.render("services/views/createPolicyRole", {
      ...model,
      csrfToken: req.csrfToken(),
      policy,
      cancelLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
      backLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
      serviceId: req.params.sid,
      currentNavigation: "policies",
    });
  }

  logger.info(
    "Validation passed. Saving new policy role to session for confirmation",
    { correlationId: req.id },
  );
  req.session.createPolicyRoleData = model;
  req.session.save((error) => {
    if (error) {
      // Any error saving to session should hopefully be temporary. Assuming this, we log the error
      // and just display an error message saying to try again.
      logger.error("An error occurred when saving to the session", error);
      model.validationMessages.role =
        "Something went wrong submitting data, please try again";
      return res.render("services/views/createPolicyRole", {
        ...model,
        csrfToken: req.csrfToken(),
        policy,
        cancelLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
        backLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
        serviceId: req.params.sid,
        currentNavigation: "policies",
      });
    }
    return res.redirect("confirm-create-policy-role");
  });
};

module.exports = postCreatePolicyRole;
