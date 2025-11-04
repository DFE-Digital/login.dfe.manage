const { getServicePolicyRaw } = require("login.dfe.api-client/services");
const logger = require("../../infrastructure/logger");

const getConfirmRemovePolicyRole = async (req, res) => {
  const name = req.query.name;
  const code = req.query.code;
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

  return res.render("services/views/confirmRemovePolicyRole", {
    csrfToken: req.csrfToken(),
    name,
    code,
    policy,
    cancelLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    backLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    serviceId: req.params.sid,
    currentNavigation: "policies",
  });
};

module.exports = getConfirmRemovePolicyRole;
