const {
  getServiceById,
  listAllServices,
} = require("../../infrastructure/applications");
const { getUserServiceRoles } = require("./utils");
const logger = require("../../infrastructure/logger");

const validate = async (req, service) => {
  const model = {
    name: req.body.name || "",
    description: req.body.description || "",
    validationMessages: {},
  };

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

  if (model.name && model.description) {
    const isNameUnchanged = service.name === model.name;
    const isDescriptionUnchanged = service.description === model.description;
    if (isNameUnchanged && isDescriptionUnchanged) {
      model.validationMessages.name =
        "Neither the name or description is different from the original";
    }
  }

  return model;
};

const postEditServiceInfo = async (req, res) => {
  const service = await getServiceById(req.params.sid, req.id);
  const model = await validate(req, service);
  const manageRolesForService = await getUserServiceRoles(req);

  if (Object.keys(model.validationMessages).length > 0) {
    return res.render("services/views/editServiceInfo", {
      model,
      csrfToken: req.csrfToken(),
      service: {
        name: service.name || "",
      },
      backLink: `/services/${req.params.sid}/service-information`,
      serviceId: req.params.sid,
      userRoles: manageRolesForService,
      currentNavigation: "",
    });
  }

  const hasNameChanged = service.name !== model.name;
  const hasDescriptionChanged = service.description !== model.description;
  const changedData = {};

  if (hasNameChanged) {
    changedData["name"] = model.name;
  }

  if (hasDescriptionChanged) {
    changedData["description"] = model.description;
  }

  req.session.editServiceInfo = changedData;
  req.session.save((error) => {
    if (error) {
      // Any error saving to session should hopefully be temporary. Assuming this, we log the error
      // and just display an error message saying to try again.
      logger.error("An error occurred when saving to the session", error);
      model.validationMessages.name =
        "Something went wrong submitting data, please try again";
      return res.render("services/views/editServiceInfo", {
        model,
        csrfToken: req.csrfToken(),
        service: {
          name: service.name || "",
        },
        backLink: `/services/${req.params.sid}/service-information`,
        serviceId: req.params.sid,
        userRoles: manageRolesForService,
        currentNavigation: "",
      });
    }
    return res.redirect("edit/confirm");
  });
};

module.exports = postEditServiceInfo;
