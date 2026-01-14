const {
  getServiceRaw,
  getServicePoliciesRaw,
} = require("login.dfe.api-client/services");
const { getUserServiceRoles } = require("../utils");
//const logger = require("../../../infrastructure/logger");

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
    const servicePolicies = await getServicePoliciesRaw({
      serviceId: req.params.sid,
      page: 1,
      pageSize: 300,
    });
    const existingNameInPolicy = servicePolicies.find(
      (policy) => policy.name === model.name,
    );
    if (existingNameInPolicy) {
      model.validationMessages.name =
        "Policy name must be unique and cannot already exist in DfE Sign-in";
    }
  }

  return model;
};

const postConfirmCreateNewPolicy = async (req, res) => {
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
      backLink: `/services/${req.params.sid}/policies`,
      cancelLink: `/services/${req.params.sid}/policies`,
      serviceId: req.params.sid,
      userRoles: manageRolesForService,
      currentNavigation: "policies",
    });
  }

  // try {
  // Call createServicePolicy endpoint
  // } catch (e) {
  // Handle exception
  //}

  // res.flash("new policy has been created")
  return res.redirect("policies");
};

module.exports = postConfirmCreateNewPolicy;
