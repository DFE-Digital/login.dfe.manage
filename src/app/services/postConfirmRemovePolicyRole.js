const {
  getServicePolicyRaw,
  getServicePoliciesRaw,
  updateServicePolicyRaw,
  getServiceRolesRaw,
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

  //* Check if more than one role exists in other policies for this service.
  const allServicePolicies = await getServicePoliciesRaw({
    serviceId: req.params.sid,
  });

  /*
  todo - extracts all service roles into one array, then checks for matches by name and code.
    */
  const matchingRoles = allServicePolicies
    .flatMap((serviceRole) => serviceRole.roles)
    .filter(
      (role) => role.name === model.roleName && role.code === model.roleCode,
    );

  const hasDuplicates = matchingRoles.length > 1;

  //todo if has duplicates remove from policy, splice from arr & update ... happy days
  if (roleInPolicy && hasDuplicates) {
    const roleIndex = policy.roles.indexOf(roleInPolicy);
    policy.roles.splice(roleIndex, 1);

    await updateServicePolicyRaw({
      serviceId: req.params.sid,
      policyId: req.params.pid,
      policy,
    });
  } else {
    //todo call delete role end point?
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
