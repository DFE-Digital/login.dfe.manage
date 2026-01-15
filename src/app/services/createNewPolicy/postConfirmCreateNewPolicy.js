const { getServiceRaw } = require("login.dfe.api-client/services");
const { getUserServiceRoles } = require("../utils");
const logger = require("../../../infrastructure/logger");

const postConfirmCreateNewPolicy = async (req, res) => {
  if (!req.session.createNewPolicy) {
    return res.redirect("policies");
  }

  const model = req.session.createNewPolicy;
  const service = await getServiceRaw({
    by: { serviceId: req.params.sid },
  });
  const manageRolesForService = await getUserServiceRoles(req);

  if (Object.keys(model.validationMessages).length > 0) {
    return res.render("services/views/createNewPolicyName", {
      model,
      csrfToken: req.csrfToken(),
      service,
      backLink: `/services/${req.params.sid}/policies`,
      cancelLink: `/services/${req.params.sid}/policies`,
      serviceId: req.params.sid,
      userRoles: manageRolesForService,
      currentNavigation: "policies",
    });
  }

  try {
    logger.info("Hit new policy endpoint", model);
  } catch (e) {
    logger.error("Something bad happened", e);
    return res.redirect("policies");
  }

  res.flash("info", "new policy has been created");
  return res.redirect("policies");
};

module.exports = postConfirmCreateNewPolicy;
