const logger = require("../../infrastructure/logger");

const postConfirmRemovePolicy = async (req, res) => {
  const policyName = req.body.name;

  // try {
  // Hit deletePolicy endpoint
  // } catch (e) {
  // handle error
  //}

  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) removed a policy for service ${req.params.sid}`,
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
