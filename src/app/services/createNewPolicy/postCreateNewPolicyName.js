const { getServiceRaw } = require("login.dfe.api-client/services");
const { getUserServiceRoles } = require("../utils");
const logger = require("../../../infrastructure/logger");

const validate = async (req) => {
  const model = {
    name: (req.body.name || "").trim(),
    validationMessages: {},
  };

  if (!model.name) {
    model.validationMessages.name = "Enter a name";
  } else if (model.name.length > 125) {
    model.validationMessages.name = "Name must be 125 characters or less";
  } else {
    // Get all policies for service
    // Does name match any existing policy name
    // if (nameMatchesExistingPolicy) {
    //   model.validationMessages.name =
    //     "Policy name must be unique and cannot already exist in DfE Sign-in";
    // }
  }

  return model;
};

const postCreateNewPolicyName = async (req, res) => {
  const service = await getServiceRaw({
    by: { serviceId: req.params.sid },
  });
  const model = await validate(req);
  const manageRolesForService = await getUserServiceRoles(req);

  if (Object.keys(model.validationMessages).length > 0) {
    return res.render("services/views/createNewPolicyName", {
      model,
      csrfToken: req.csrfToken(),
      service,
      backLink: `/services/${req.params.sid}/service-information`,
      cancelLink: `/services/${req.params.sid}/service-information`,
      serviceId: req.params.sid,
      userRoles: manageRolesForService,
      currentNavigation: "policies",
    });
  }

  req.session.createNewPolicy = model;
  req.session.save((error) => {
    if (error) {
      // Any error saving to session should hopefully be temporary. Assuming this, we log the error
      // and just display an error message saying to try again.
      logger.error("An error occurred when saving to the session", error);
      model.validationMessages.name =
        "Something went wrong submitting data, please try again";
      return res.render("services/views/createNewPolicyName", {
        csrfToken: req.csrfToken(),
        model,
        service,
        backLink: `/services/${req.params.sid}/policies`,
        cancelLink: `/services/${req.params.sid}/policies`,
        currentNavigation: "",
        serviceId: req.params.sid,
        userRoles: manageRolesForService,
      });
    }
    return res.redirect("create-new-policy-role");
  });
};

module.exports = postCreateNewPolicyName;
