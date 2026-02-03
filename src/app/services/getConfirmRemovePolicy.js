const { getServicePolicyRaw } = require("login.dfe.api-client/services");
const { getUserServiceRoles } = require("./utils");
const logger = require("../../infrastructure/logger");

const getConfirmRemovePolicy = async (req, res) => {
  const manageRolesForService = await getUserServiceRoles(req);
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

  return res.render("services/views/confirmRemovePolicy", {
    csrfToken: req.csrfToken(),
    policy,
    cancelLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    backLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    serviceId: req.params.sid,
    currentNavigation: "policies",
    userRoles: manageRolesForService,
  });
};

module.exports = getConfirmRemovePolicy;
