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
    (role) => role.name === model.roleName && role.code === model.roleCode,
  );

  if (existingRole) {
    logger.info(
      `${model.roleName}: [code: ${model.roleCode}] found in service, adding existing role to policy`,
      { correlationId },
    );
    policy.roles.push(existingRole);
    return;
  }

  logger.info(
    `${model.roleName}: [code: ${model.roleCode}] not found in service, creating new role`,
    { correlationId },
  );

  const newRole = await createServiceRole(model);
  policy.roles.push(newRole);
};

const handleRoleCreationError = (error, model, req, res) => {
  logger.error(
    `Error creating service role: ${model.roleName} [code: ${model.roleCode}]`,
    { correlationId: req.id, error: error.message },
  );

  req.session.createPolicyRoleData = model;
  res.flash(
    "error",
    `Failed to create policy role ${model.roleName}. Please try again.`,
  );

  return res.redirect("conditionsAndRoles");
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

  try {
    await addRoleToPolicy(policy, model, allServiceRoles, req.id);
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
  res.flash(
    "info",
    `Policy role ${model.roleName} ${model.roleCode} successfully added`,
  );

  return res.redirect("conditionsAndRoles");
};

module.exports = postConfirmCreatePolicyRole;
