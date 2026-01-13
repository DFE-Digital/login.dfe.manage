const { getServiceRaw } = require("login.dfe.api-client/services");
const { getUserServiceRoles } = require("../utils");
const logger = require("../../../infrastructure/logger");

const validate = async (req) => {
  const model = {
    appId: req.params.sid || "",
    roleName: req.body.roleName.trim() || "",
    roleCode: req.body.roleCode.trim() || "",
    validationMessages: {},
  };

  if (!model.roleName) {
    model.validationMessages.roleName = "Please enter a role name";
  }

  if (!model.roleCode) {
    model.validationMessages.roleCode = "Please enter a role code";
  }

  if (model.roleName.length > 125) {
    model.validationMessages.roleName =
      "Role name must be 125 characters or less";
  }

  if (model.roleCode.length > 50) {
    model.validationMessages.roleCode =
      "Role code must be 50 characters or less";
  }

  return model;
};

const postEditServiceInfo = async (req, res) => {
  const service = await getServiceRaw({
    by: { serviceId: req.params.sid },
  });
  const model = await validate(req, service);
  const manageRolesForService = await getUserServiceRoles(req);

  if (Object.keys(model.validationMessages).length > 0) {
    return res.render("services/views/createNewPolicyRole", {
      model,
      csrfToken: req.csrfToken(),
      service,
      backLink: `/services/${req.params.sid}/policies/create-new-policy-name`,
      cancelLink: `/services/${req.params.sid}/policies`,
      currentNavigation: "policies",
      serviceId: req.params.sid,
      userRoles: manageRolesForService,
    });
  }

  req.session.createNewPolicy.role = model;
  req.session.save((error) => {
    if (error) {
      // Any error saving to session should hopefully be temporary. Assuming this, we log the error
      // and just display an error message saying to try again.
      logger.error("An error occurred when saving to the session", error);
      model.validationMessages.roleName =
        "Something went wrong submitting data, please try again";
      return res.render("services/views/createNewPolicyRole", {
        model,
        csrfToken: req.csrfToken(),
        service,
        backLink: `/services/${req.params.sid}/policies/create-new-policy-name`,
        cancelLink: `/services/${req.params.sid}/policies`,
        currentNavigation: "policies",
        serviceId: req.params.sid,
        userRoles: manageRolesForService,
      });
    }
    // Only temporary, will redirect to conditions page in a future card
    return res.redirect("policies");
  });
};

module.exports = postEditServiceInfo;
