const { getServicePolicyRaw } = require("login.dfe.api-client/services");
const logger = require("../../infrastructure/logger");

const getConfirmRemovePolicyRole = async (req, res) => {
  const roleId = req.query.roleId;

  if (!roleId) {
    logger.info("No roleId provided in query params", {
      correlationId: req.id,
    });
    res.flash("error", "Role not found in policy.");
    return res.redirect(
      `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    );
  }

  let policy;

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

  const role = (policy.roles ?? []).find((r) => r.id === roleId);

  if (!role) {
    logger.info(`[${roleId}] not found in existing policy`, {
      correlationId: req.id,
    });
    res.flash(
      "error",
      "Role not found in policy. It may have already been removed.",
    );
    return res.redirect(
      `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    );
  }

  return res.render("services/views/confirmRemovePolicyRole", {
    csrfToken: req.csrfToken(),
    name: role.name,
    code: role.code,
    roleId,
    policy,
    cancelLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    backLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    serviceId: req.params.sid,
    currentNavigation: "policies",
  });
};

module.exports = getConfirmRemovePolicyRole;
