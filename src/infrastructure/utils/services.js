const path = require("path");
const {
  updateService: updateServiceApiClient,
} = require("login.dfe.api-client/services");

// Resolve the api-client package root via three dirname calls on the known
// exported path (dist/services/index.js → dist/services → dist → root).
// Using absolute paths bypasses the package exports map restriction so we can
// reach internal modules not yet exposed as public exports (e.g. getApiClient).
const _apiClientRoot = path.dirname(
  path.dirname(path.dirname(require.resolve("login.dfe.api-client/services"))),
);
const { getApiClient, ApiName } = require(
  path.join(_apiClientRoot, "dist", "api", "index.js"),
);
const { RequestMethod } = require(
  path.join(_apiClientRoot, "dist", "api", "common", "ApiClient.js"),
);

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

  // isHiddenService is stripped by the api-client's camelToSnakeMapping so we
  // send it via a direct PATCH that bypasses the transform.
  if (serviceDetails.isHiddenService !== undefined) {
    const client = getApiClient(ApiName.Applications);
    const response = await client.requestRaw(
      RequestMethod.PATCH,
      `/services/${serviceId}`,
      { jsonBody: { isHiddenService: serviceDetails.isHiddenService } },
    );
    if (response && !response.ok) {
      throw new Error(
        `Failed to update isHiddenService for service ${serviceId}: HTTP ${response.status}`,
      );
    }
  }
};

const updateServiceParam = async ({ serviceId, paramName, paramValue }) => {
  const client = getApiClient(ApiName.Applications);
  const response = await client.requestRaw(
    RequestMethod.PUT,
    `/services/${serviceId}/params/${paramName}`,
    { jsonBody: { paramName, paramValue } },
  );
  if (response && !response.ok) {
    throw new Error(
      `Failed to update service param ${paramName} for service ${serviceId}: HTTP ${response.status}`,
    );
  }
};

module.exports = {
  updateService,
  updateServiceParam,
};
