const logger = require("../../../infrastructure/logger");

const postConfirmCreateNewPolicy = async (req, res) => {
  if (!req.session.createNewPolicy) {
    return res.redirect(`/services/${req.params.sid}/policies`);
  }

  const model = req.session.createNewPolicy;

  // Note:  The endpoint to create a policy can support multiple roles and conditions
  // on creation.  We only did 1 so we could deliver the MVP of this feature, but a future
  // iteration of this feature could allow multiple roles and conditions to be added when
  // the policy is being created.

  // Hitting the endpoint to create the policy will be done in a future card
  // try {
  logger.info("Hit new policy endpoint", model);
  // } catch (e) {
  //   logger.error("Something bad happened", e);
  //   return res.redirect(`/services/${req.params.sid}/policies`);
  // }

  res.flash("info", `'${model.name}' policy was successfully created`);
  req.session.createNewPolicy = undefined;
  return res.redirect(`/services/${req.params.sid}/policies`);
};

module.exports = postConfirmCreateNewPolicy;
