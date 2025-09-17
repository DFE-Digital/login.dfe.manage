const {
  updateService: updateServiceApiClient,
} = require("login.dfe.api-client/services");

const updateService = async (serviceId, serviceDetails) => {
  const updatedServiceDetails = {};
  if (serviceDetails.name) {
    updatedServiceDetails.name = serviceDetails.name;
  }
  if (serviceDetails.serviceHome !== undefined) {
    updatedServiceDetails.serviceHome =
      serviceDetails.serviceHome === "" ? null : serviceDetails.serviceHome;
  }
  if (serviceDetails.clientId) {
    updatedServiceDetails.clientId = serviceDetails.clientId;
  }
  if (serviceDetails.clientSecret) {
    updatedServiceDetails.clientSecret = serviceDetails.clientSecret;
  }
  if (serviceDetails.redirect_uris) {
    updatedServiceDetails.redirectUris = serviceDetails.redirect_uris;
  }
  if (serviceDetails.post_logout_redirect_uris) {
    updatedServiceDetails.postLogoutRedirectUris =
      serviceDetails.post_logout_redirect_uris;
  }
  if (serviceDetails.grant_types) {
    updatedServiceDetails.grantTypes = serviceDetails.grant_types;
  }
  if (serviceDetails.response_types) {
    updatedServiceDetails.responseTypes = serviceDetails.response_types;
  }
  if (serviceDetails.apiSecret) {
    updatedServiceDetails.apiSecret = serviceDetails.apiSecret;
  }
  if (serviceDetails.description) {
    updatedServiceDetails.description = serviceDetails.description;
  }
  if (serviceDetails.postResetUrl !== undefined) {
    updatedServiceDetails.postResetUrl =
      serviceDetails.postResetUrl === "" ? null : serviceDetails.postResetUrl;
  }
  if (serviceDetails.tokenEndpointAuthMethod !== undefined) {
    updatedServiceDetails.tokenEndpointAuthMethod =
      serviceDetails.tokenEndpointAuthMethod;
  }

  await updateServiceApiClient({
    serviceId: serviceId,
    update: updatedServiceDetails,
  });
};

module.exports = {
  updateService,
};
