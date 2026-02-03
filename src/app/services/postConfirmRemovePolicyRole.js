const {
  getServicePolicyRaw,
  getServicePoliciesRaw,
  updateServicePolicyRaw,
  deleteServiceRoleRaw,
} = require("login.dfe.api-client/services");
const logger = require("../../infrastructure/logger");

const handleApiError = (error, req, res, errorMessage, flashMessage) => {
  logger.error(errorMessage, {
    correlationId: req.id,
    error: error,
  });
  res.flash("error", flashMessage);
  return res.redirect(
    `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
  );
};

const postConfirmRemovePolicyRole = async (req, res) => {
  const model = {
    appId: req.params.sid,
    roleName: req.body.name || "",
    roleCode: req.body.code || "",
    validationMessages: {},
  };
  let policy;

  try {
    policy = await getServicePolicyRaw({
      serviceId: req.params.sid,
      policyId: req.params.pid,
    });
  } catch (error) {
    return handleApiError(
      error,
      req,
      res,
      `Error retrieving service policy ${req.params.pid}`,
      "Failed to retrieve policy. Please try again.",
    );
  }

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

  /* Check if the role exists in other policies for this service.
  If it does, remove the role and update the policy.
  If not, remove the role and delete the role completely. */
  let allServicePolicies;
  let roleInMultiplePolicies;

  try {
    allServicePolicies = await getServicePoliciesRaw({
      serviceId: req.params.sid,
    });

    roleInMultiplePolicies = allServicePolicies
      .flatMap((serviceRole) => serviceRole.roles)
      .filter((role) => role.id === roleInPolicy.id);
  } catch (error) {
    return handleApiError(
      error,
      req,
      res,
      `Error retrieving service policies for service ${req.params.sid}`,
      "Failed to retrieve service policies. Please try again.",
    );
  }

  const roleIndex = policy.roles.indexOf(roleInPolicy);
  policy.roles.splice(roleIndex, 1);

  try {
    await updateServicePolicyRaw({
      serviceId: req.params.sid,
      policyId: req.params.pid,
      policy,
    });
  } catch (error) {
    return handleApiError(
      error,
      req,
      res,
      `Error updating policy ${req.params.pid}`,
      "Failed to update policy. Please try again.",
    );
  }

  const roleUsedInOtherPolicies = roleInMultiplePolicies.length > 1;

  if (!roleUsedInOtherPolicies) {
    logger.info(
      `[${policy.applicationId}] [${roleInPolicy.id}] does not exist in any other policies for this service. Calling deleteServiceRoleRaw.`,
      { correlationId: req.id },
    );
    try {
      /*
      ‘Tidying up user_service_roles, invitations and requests data is difficult when multiple policies are using a role as we don’t record what policy granted the role for the user. The best we can currently do is clean it all up once the last role is deleted.  In the future, we should tidy up this data when a role is unlinked from a policy'
      */
      await deleteServiceRoleRaw({
        serviceId: policy.applicationId,
        roleId: roleInPolicy.id,
      });
    } catch (error) {
      return handleApiError(
        error,
        req,
        res,
        `Error deleting role ${roleInPolicy.id}`,
        "Failed to delete role. Please try again.",
      );
    }
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
