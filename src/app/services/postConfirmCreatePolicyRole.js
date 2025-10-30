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
    (role) => role.code.toUpperCase() === model.roleCode.toUpperCase(),
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

const handlePolicyUpdateError = (error, model, req, res, errorMessage) => {
  logger.error(errorMessage, {
    correlationId: req.id,
    error: error,
  });

  req.session.createPolicyRoleData = model;
  return req.session.save((saveError) => {
    if (saveError) {
      // Any error saving to session should hopefully be temporary. Assuming this, we log the error
      // and just display an error message saying to try again.
      logger.error("An error occurred when saving to the session", saveError);
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
    res.flash("error", "Failed to update policy. Please try again.");
    return res.redirect("conditionsAndRoles");
  });
};

const postConfirmCreatePolicyRole = async (req, res) => {
  const model = req.session.createPolicyRoleData;

  let policy;
  let allServiceRoles;

  try {
    policy = await getServicePolicyRaw({
      serviceId: req.params.sid,
      policyId: req.params.pid,
    });
  } catch (error) {
    logger.error(`Error retrieving service policy ${req.params.pid}`, {
      correlationId: req.id,
      error: error,
    });
    res.flash("error", "Failed to retrieve policy. Please try again.");
    return res.redirect(
      `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    );
  }

  try {
    allServiceRoles = await getServiceRolesRaw({
      serviceId: req.params.sid,
    });
  } catch (error) {
    logger.error(
      `Error retrieving service roles for service ${req.params.sid}`,
      {
        correlationId: req.id,
        error: error,
      },
    );
    res.flash("error", "Failed to retrieve service roles. Please try again.");
    return res.redirect(
      `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    );
  }

  let addedRole;

  try {
    addedRole = await addRoleToPolicy(policy, model, allServiceRoles, req.id);
  } catch (error) {
    return handlePolicyUpdateError(
      error,
      model,
      req,
      res,
      `Error creating service role: ${model.roleName} [code: ${model.roleCode}]`,
    );
  }

  try {
    await updateServicePolicyRaw({
      serviceId: req.params.sid,
      policyId: req.params.pid,
      policy,
    });
  } catch (error) {
    return handlePolicyUpdateError(
      error,
      model,
      req,
      res,
      `Error updating service policy ${req.params.pid} for service ${req.params.sid}`,
    );
  }

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
      `A role with this code ${addedRole.code} and the name ${addedRole.name} already exist for this service. ${addedRole.name} has been successfully added to the policy`,
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
