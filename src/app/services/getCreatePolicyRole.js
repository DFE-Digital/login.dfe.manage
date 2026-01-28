const { getUserServiceRoles } = require("./utils");
const { getServicePolicyRaw } = require("login.dfe.api-client/services");
const logger = require("../../infrastructure/logger");

const getCreatePolicyRole = async (req, res) => {
  try {
    const manageRolesForService = await getUserServiceRoles(req);
    const policy = await getServicePolicyRaw({
      serviceId: req.params.sid,
      policyId: req.params.pid,
    });

    return res.render("services/views/createPolicyRole", {
      validationMessages: {},
      csrfToken: req.csrfToken(),
      policy,
      cancelLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
      backLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
      serviceId: req.params.sid,
      currentNavigation: "policies",
      userRoles: manageRolesForService,
    });
  } catch (error) {
    logger.error("Error retrieving service policy", {
      correlationId: req.id,
      serviceId: req.params.sid,
      policyId: req.params.pid,
      error: error,
    });
    res.flash(
      "error",
      "An error occurred while retrieving the policy. Please try again.",
    );
    return res.redirect(
      `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    );
  }
};

module.exports = getCreatePolicyRole;
