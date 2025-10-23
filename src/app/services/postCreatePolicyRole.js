const { getServicePolicyRaw } = require("login.dfe.api-client/services");
// const { getOrganisationRaw } = require("login.dfe.api-client/organisations");
// const { getUserServiceRoles } = require("./utils");
// const { validate: validateUUID } = require("uuid");
const logger = require("../../infrastructure/logger");

const validate = async (req) => {
  const model = {
    roleName: req.body.name || "",
    roleCode: req.body.code || "",
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

  //* CHECK FOR EXISTING ROLE
  const roleInPolicy = policy.roles.find(
    (role) => role.name === model.roleName && role.code === model.roleCode,
  );

  if (roleInPolicy) {
    model.validationMessages.roleExists = "This role already exists";
    logger.info(
      `${model.roleName}: [code: ${model.roleCode}] found in policy`,
      { correlationId: req.id },
    );
  }

  return model;
};

const postCreatePolicyRole = async (req, res) => {
  console.log("postCreatePolicyRole: ", req.params.sid);
  console.log("postCreatePolicyRole: ", req.params.pid);
  console.log("REQ.BODY: ", req.body.name);
  console.log("REQ.BODY: ", req.body.code);
  const policy = await getServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
  });
  const model = await validate(req);
  // const manageRolesForService = await getUserServiceRoles(req);

  if (Object.keys(model.validationMessages).length > 0) {
    return res.render("services/views/createPolicyRole", {
      ...model,
      csrfToken: req.csrfToken(),
      policy,
      cancelLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
      backLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
      serviceId: req.params.sid,
      // currentNavigation: "policies",
      // userRoles: manageRolesForService,
    });
  }

  //! CONTINUE FROM HERE
  logger.info(
    "Validation passed.  Saving new policy role to session for confirmation",
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
        // userRoles: manageRolesForService,
      });
    }
    return res.redirect("confirm-create-policy-role");
  });
};

module.exports = postCreatePolicyRole;
