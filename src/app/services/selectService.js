const sortBy = require("lodash/sortBy");
const chunk = require("lodash/chunk");
const { getServiceSummaries } = require("../../infrastructure/applications");
const logger = require("../../infrastructure/logger");

const getServiceDetails = async (req) => {
  // Unique service IDs obtained from the user's manage roles.
  const userServicesIds = new Set(
    req.userServices.roles.map((role) =>
      role.code.substr(0, role.code.indexOf("_")),
    ),
  );
  // Group service IDs into requests (promises) to get their summaries.
  const groupedServices = chunk([...userServicesIds], 33);
  const requests = groupedServices.map((x) =>
    getServiceSummaries(x, ["id", "name", "description"], req.id),
  );
  // Wait for all requests to complete or one to fail.
  const responses = await Promise.all(requests);
  // Get services from responses.
  const services = responses
    .map((response) => {
      let responseServices = [];
      if (response !== null) {
        responseServices = response.services ? response.services : [response];
      }
      return responseServices;
    })
    .flat();

  if (services.length === 0) {
    const message = `No manage services found with IDs [${[...userServicesIds].join()}]`;
    logger.error(message, { correlationId: req.id });
    throw new Error(`${message}, correlation ID ${req.id}`);
  }

  return sortBy(services, "name");
};

const get = async (req, res) => {
  if (!req.userServices || req.userServices.roles.length === 0) {
    return res.status(401).render("errors/views/notAuthorised");
  }

  const userServices = await getServiceDetails(req);
  if (userServices.length === 1) {
    const service = userServices[0];
    return res.redirect(`${service.id}`);
  }
  return res.render("services/views/selectService", {
    csrfToken: req.csrfToken(),
    title: "Select service",
    services: userServices,
    validationMessages: {},
  });
};

const validate = async (req) => {
  const userServices = await getServiceDetails(req);
  const { selectedService } = req.body;
  const model = {
    title: "Select service",
    services: userServices,
    selectedService,
    validationMessages: {},
  };
  if (
    model.selectedService === undefined ||
    model.selectedService === null ||
    typeof userServices.find(
      (service) => service.id === model.selectedService,
    ) === "undefined"
  ) {
    model.validationMessages.selectedService = "Please select a service";
  }
  return model;
};

const post = async (req, res) => {
  const model = await validate(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render("services/views/selectService", model);
  }
  return res.redirect(`/services/${model.selectedService}`);
};

module.exports = {
  get,
  post,
};
