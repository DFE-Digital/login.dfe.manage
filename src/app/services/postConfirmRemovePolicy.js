const { deleteServicePolicy } = require("login.dfe.api-client/services");
const logger = require("../../infrastructure/logger");

const postConfirmRemovePolicy = async (req, res) => {
  const policyName = req.body.name;

  try {
    await deleteServicePolicy({
      serviceId: req.params.sid,
      policyId: req.params.pid,
    });
  } catch (e) {
    logger.error("Something went wrong when deleting service policy", e);
    res.flash("error", "Something went wrong when deleting the service policy");
    return res.redirect(`/services/${req.params.sid}/policies`);
  }

  logger.audit(
    `${req.user.email} removed a policy for service ${req.params.sid}`,
    {
      type: "manage",
      subType: "policy-removed",
      userId: req.user.sub,
      userEmail: req.user.email,
      serviceId: req.params.sid,
      policyName,
    },
  );

  res.flash("info", `Policy '${policyName}' successfully removed`);

  return res.redirect(`/services/${req.params.sid}/policies`);
};

module.exports = postConfirmRemovePolicy;
