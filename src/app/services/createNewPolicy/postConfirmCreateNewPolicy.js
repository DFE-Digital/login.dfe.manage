const logger = require("../../../infrastructure/logger");

const postConfirmCreateNewPolicy = async (req, res) => {
  if (!req.session.createNewPolicy) {
    return res.redirect(`/services/${req.params.sid}/policies`);
  }

  const model = req.session.createNewPolicy;

  try {
    logger.info("Hit new policy endpoint", model);
  } catch (e) {
    logger.error("Something bad happened", e);
    return res.redirect(`/services/${req.params.sid}/policies`);
  }

  res.flash("info", `'${model.name} policy was successfully created`);
  req.session.createNewPolicy = undefined;
  return res.redirect(`/services/${req.params.sid}/policies`);
};

module.exports = postConfirmCreateNewPolicy;
