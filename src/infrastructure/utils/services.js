const {
  updateService: updateServiceApiClient,
  updateServiceParam,
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
  if (serviceDetails.isHiddenService !== undefined) {
    updatedServiceDetails.isHiddenService = serviceDetails.isHiddenService;
  }

  await updateServiceApiClient({
    serviceId: serviceId,
    update: updatedServiceDetails,
  });
};

// updateServiceParam uses PUT which only updates existing params. This helper
// falls back to POST when the param doesn't exist (404), because the api-client
// does not export the `./api` subpath needed to call POST directly at the top level.
const upsertServiceParam = async ({ serviceId, paramName, paramValue }) => {
  try {
    await updateServiceParam({ serviceId, paramName, paramValue });
  } catch (err) {
    if (err?.statusCode === 404) {
      // Lazy-load api-client internals via direct file path to bypass the package's
      // `exports` restriction — `./api` is intentionally not a public export.
      const {
        getApiClient,
        ApiName,
      } = require("../../../node_modules/login.dfe.api-client/dist/api/index.js");
      const {
        RequestMethod,
      } = require("../../../node_modules/login.dfe.api-client/dist/api/common/ApiClient.js");
      const client = getApiClient(ApiName.Applications);
      const response = await client.requestRaw(
        RequestMethod.POST,
        `/services/${serviceId}/params`,
        { jsonBody: { paramName, paramValue } },
      );
      if (response.status < 200 || response.status >= 300) {
        throw new Error(
          `Failed to create service param ${paramName}: HTTP ${response.status}`,
        );
      }
    } else {
      throw err;
    }
  }
};

module.exports = {
  updateService,
  upsertServiceParam,
};
