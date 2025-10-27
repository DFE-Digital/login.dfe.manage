const {
  getServicePolicyRaw,
  updateServicePolicyRaw,
  createServiceRole,
  getServiceRolesRaw,
} = require("login.dfe.api-client/services");
const logger = require("../../infrastructure/logger");

const addRoleToPolicy = async (
  policy,
  model,
  allServiceRoles,
  correlationId,
) => {
  const existingRole = allServiceRoles.find(
    (role) => role.code === model.roleCode,
  );

  if (existingRole) {
    logger.info(
      `A role with [code: ${model.roleCode}] found in service, with name "${existingRole.name}". Adding existing role to policy`,
      { correlationId },
    );
    policy.roles.push(existingRole);
    return existingRole;
  }

  logger.info(
    `${model.roleName}: [code: ${model.roleCode}] not found in service, creating new role`,
    { correlationId },
  );

  const newRole = await createServiceRole(model);
  policy.roles.push(newRole);
  return newRole;
};

const handleRoleCreationError = (error, model, req, res) => {
  logger.error(
    `Error creating service role: ${model.roleName} [code: ${model.roleCode}]`,
    { correlationId: req.id, error: error.message },
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
        cancelLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
        backLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
        serviceId: req.params.sid,
        currentNavigation: "policies",
      });
    }
    res.flash(
      "error",
      `Failed to create policy role ${model.roleName}. Please try again.`,
    );
    return res.redirect("conditionsAndRoles");
  });
};

const postConfirmCreatePolicyRole = async (req, res) => {
  const model = req.session.createPolicyRoleData;

  const policy = await getServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
  });

  const allServiceRoles = await getServiceRolesRaw({
    serviceId: req.params.sid,
  });

  let addedRole;

  try {
    addedRole = await addRoleToPolicy(policy, model, allServiceRoles, req.id);
  } catch (error) {
    return handleRoleCreationError(error, model, req, res);
  }

  await updateServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
    policy,
  });

  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) added a policy role for service ${req.params.sid} and policy ${req.params.pid}`,
    {
      type: "manage",
      subType: "policy-role-added",
      userId: req.user.sub,
      userEmail: req.user.email,
      name: model.roleName,
      code: model.roleCode,
    },
  );

  req.session.createPolicyRoleData = undefined;
  if (addedRole.name !== model.roleName) {
    res.flash(
      "info",
      `A role with this code ${addedRole.code} and the name ${addedRole.name} existed for this service. ${addedRole.name} has been successfully added to the policy`,
    );
  } else {
    res.flash(
      "info",
      `Policy role ${model.roleName} ${model.roleCode} successfully added`,
    );
  }
  return res.redirect("conditionsAndRoles");
};

module.exports = postConfirmCreatePolicyRole;
