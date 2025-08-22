const {
  getServiceById,
  listAllServices,
} = require("../../infrastructure/applications");
const { getUserServiceRoles } = require("./utils");
const logger = require("../../infrastructure/logger");

const validate = async (req) => {
  const model = {
    name: req.body.name || "",
    description: req.body.description || "",
    validationMessages: {},
  };

  const service = await getServiceById(req.params.sid, req.id);

  if (!model.name) {
    model.validationMessages.name = "Enter a name";
  } else if (model.name.length > 200) {
    model.validationMessages.name = "Name must be 200 characters or less";
  } else if (service.name !== model.name) {
    // Only check if the name was changed
    const allServices = await listAllServices();
    const isMatchingName = allServices.services.find(
      (service) => service.name === model.name,
    );
    if (isMatchingName) {
      model.validationMessages.name =
        "Service name must be unique and cannot already exist in DfE Sign-in";
    }
  }

  if (!model.description) {
    model.validationMessages.description = "Enter a description";
  } else if (model.description.length > 200) {
    model.validationMessages.description =
      "Description must be 200 characters or less";
  }

  return model;
};

const postEditServiceInfo = async (req, res) => {
  const service = await getServiceById(req.params.sid, req.id);
  const model = await validate(req);
  const manageRolesForService = await getUserServiceRoles(req);

  if (Object.keys(model.validationMessages).length > 0) {
    return res.render("services/views/editServiceInfo", {
      model,
      csrfToken: req.csrfToken(),
      service: {
        name: service.name || "",
        description: service.description || "",
      },
      backLink: `/services/${req.params.sid}`,
      serviceId: req.params.sid,
      userRoles: manageRolesForService,
      currentNavigation: "",
    });
  }

  // TODO once validation passed, need to figure out which fields have actually changed and only pass
  // that in.

  logger.info(
    "Validation passed.  Saving name/description to session for confirmation",
    { correlationId: req.id },
  );
  // TODO do we maybe pass in service name, desc and Id. Id stops potential tampering?
  req.session.editServiceInfo = model;
  req.session.save((error) => {
    if (error) {
      // Any error saving to session should hopefully be temporary. Assuming this, we log the error
      // and just display an error message saying to try again.
      logger.error("An error occurred when saving to the session", error);
      model.validationMessages.name =
        "Something went wrong submitting data, please try again";
      return res.render("services/views/editServiceInfo", {
        ...model,
        csrfToken: req.csrfToken(),
        service: {
          name: service.name || "",
          description: service.description || "",
        },
        backLink: `/services/${req.params.sid}`,
        serviceId: req.params.sid,
        userRoles: manageRolesForService,
        currentNavigation: "",
      });
    }
    return res.redirect("edit/confirm");
  });
};

module.exports = postEditServiceInfo;
