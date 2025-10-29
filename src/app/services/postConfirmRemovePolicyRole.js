const {
  getServicePolicyRaw,
  getServicePoliciesRaw,
  updateServicePolicyRaw,
  deleteServiceRoleRaw,
} = require("login.dfe.api-client/services");
const logger = require("../../infrastructure/logger");

const postConfirmRemovePolicyRole = async (req, res) => {
  const model = {
    appId: req.params.sid || "",
    roleName: req.body.name || "",
    roleCode: req.body.code || "",
    validationMessages: {},
  };

  const policy = await getServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
  });

  const roleInPolicy = policy.roles.find(
    (role) => role.name === model.roleName && role.code === model.roleCode,
  );
  console.log("roleInPolicy: ", roleInPolicy);

  if (!roleInPolicy) {
    logger.info(
      `[${model.roleName}] [${model.roleCode}] not found in existing policy`,
      { correlationId: req.id },
    );
    res.flash(
      "info",
      `Policy role [${model.roleName}] [${model.roleCode}] not found in policy. Policy has not been modified`,
    );
    return res.redirect("conditionsAndRoles");
  }

  /* Check if the role exists in other policies for this service. 
  If it does, remove the role and update the policy. 
  If not, remove the role and delete the role completely. */
  const allServicePolicies = await getServicePoliciesRaw({
    serviceId: req.params.sid,
  });

  // extracts all service roles into one array, then checks to see in role exists more than once.
  const roleInMultiplePolicies = allServicePolicies
    .flatMap((serviceRole) => serviceRole.roles)
    .filter((role) => role.id === roleInPolicy.id);

  console.log("roleInMultiplePolicies: ", roleInMultiplePolicies);

  const roleUsedInOtherPolicies = roleInMultiplePolicies.length > 1;
  console.log("roleUsedInOtherPolicies: ", roleUsedInOtherPolicies);

  const roleIndex = policy.roles.indexOf(roleInPolicy);
  policy.roles.splice(roleIndex, 1);

  await updateServicePolicyRaw({
    serviceId: req.params.sid,
    policyId: req.params.pid,
    policy,
  });

  if (!roleUsedInOtherPolicies) {
    console.log("ATTEMPTING TO DELETE WITH deleteServiceRoleRaw ");
    logger.info(
      `[${policy.applicationId}] [${roleInPolicy.id}] is the last role in all policies in this service. Calling deleteServiceRoleRaw.`,
      { correlationId: req.id },
    );
    console.log("policy.serviceId: ", policy.applicationId);
    await deleteServiceRoleRaw(policy.applicationId, roleInPolicy.id);
  }

  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) removed a policy role for service ${req.params.sid} and policy ${req.params.pid}`,
    {
      type: "manage",
      subType: "policy-role-removed",
      userId: req.user.sub,
      userEmail: req.user.email,
      name: model.roleName,
      code: model.roleCode,
    },
  );

  res.flash(
    "info",
    `Policy role ${model.roleName} ${model.roleCode} successfully removed`,
  );

  return res.redirect("conditionsAndRoles");
};

module.exports = postConfirmRemovePolicyRole;
