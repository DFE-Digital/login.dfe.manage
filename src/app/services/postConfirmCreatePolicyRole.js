const {
  getServicePolicyRaw,
  updateServicePolicyRaw,
  createServiceRole,
  getServiceRolesRaw,
} = require("login.dfe.api-client/services");
const logger = require("../../infrastructure/logger");

const postConfirmCreatePolicyRole = async (req, res) => {
  const model = req.session.createPolicyRoleData;

  const policy = await getServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
  });

  const existingServiceRoles = await getServiceRolesRaw({
    serviceId: req.params.sid,
  });

  const roleExistsInService = existingServiceRoles.find(
    (role) => role.name === model.roleName && role.code === model.roleCode,
  );

  if (roleExistsInService) {
    logger.info(
      `${model.roleName}: [code: ${model.roleCode}] found in service, pushing existing record to array`,
      { correlationId: req.id },
    );
    policy.roles.push(roleExistsInService);
  } else {
    logger.info(
      `${model.roleName}: [code: ${model.roleCode}] not found in service, pushing new record to array`,
      { correlationId: req.id },
    );
    const newRole = await createServiceRole(model);
    policy.roles.push(newRole);
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
