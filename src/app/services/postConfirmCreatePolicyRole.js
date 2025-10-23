const {
  getServicePolicyRaw,
  updateServicePolicyRaw,
  createServiceRole,
} = require("login.dfe.api-client/services");
const logger = require("../../infrastructure/logger");

const postConfirmCreatePolicyRole = async (req, res) => {
  console.log(
    "!!! postConfirmCreatePolicyRole !!! ",
    postConfirmCreatePolicyRole,
  );
  const model = req.session.createPolicyRoleData;

  const policy = await getServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
  });
  console.log("policy: ", policy);
  console.log("model: ", model);

  logger.info(
    `${model.roleName}: [code: ${model.roleCode}] not found in policy, pushing new record to array`,
    { correlationId: req.id },
  );
  const role = createServiceRole(model);

  policy.roles.push(role);

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
