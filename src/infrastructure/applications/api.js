const { fetchApi } = require("login.dfe.async-retry");
const jwtStrategy = require("login.dfe.jwt-strategies");
const config = require("../config");

const callApi = async (endpoint, method, body, correlationId) => {
  const token = await jwtStrategy(config.applications.service).getBearerToken();

  try {
    return await fetchApi(`${config.applications.service.url}/${endpoint}`, {
      method,
      headers: {
        authorization: `bearer ${token}`,
        "x-correlation-id": correlationId,
      },
      body,
    });
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 401 || status === 404) {
      return null;
    }
    if (status === 409) {
      return false;
    }
    throw e;
  }
};

const listAllServices = async (correlationId) =>
  callApi("services", "GET", undefined, correlationId);

const updateService = async (id, serviceDetails, correlationId) => {
  const body = {};
  if (serviceDetails.name) {
    body.name = serviceDetails.name;
  }
  if (serviceDetails.serviceHome !== undefined) {
    body.serviceHome =
      serviceDetails.serviceHome === "" ? null : serviceDetails.serviceHome;
  }
  if (serviceDetails.clientId) {
    body.clientId = serviceDetails.clientId;
  }
  if (serviceDetails.clientSecret) {
    body.clientSecret = serviceDetails.clientSecret;
  }
  if (serviceDetails.redirect_uris) {
    body.redirect_uris = serviceDetails.redirect_uris;
  }
  if (serviceDetails.post_logout_redirect_uris) {
    body.post_logout_redirect_uris = serviceDetails.post_logout_redirect_uris;
  }
  if (serviceDetails.grant_types) {
    body.grant_types = serviceDetails.grant_types;
  }
  if (serviceDetails.response_types) {
    body.response_types = serviceDetails.response_types;
  }
  if (serviceDetails.apiSecret) {
    body.apiSecret = serviceDetails.apiSecret;
  }
  if (serviceDetails.description) {
    body.description = serviceDetails.description;
  }
  if (serviceDetails.postResetUrl !== undefined) {
    body.postResetUrl =
      serviceDetails.postResetUrl === "" ? null : serviceDetails.postResetUrl;
  }
  if (serviceDetails.tokenEndpointAuthMethod !== undefined) {
    body.tokenEndpointAuthMethod = serviceDetails.tokenEndpointAuthMethod;
  }
  return callApi(`services/${id}`, "PATCH", body, correlationId);
};

const listBannersForService = async (id, pageSize, page, correlationId) =>
  callApi(
    `services/${id}/banners?pageSize=${pageSize}?&page=${page}`,
    "GET",
    undefined,
    correlationId,
  );

const listAllBannersForService = async (id, correlationId) => {
  const allBanners = [];

  let pageNumber = 1;
  let isMorePages = true;
  while (isMorePages) {
    const page = await listBannersForService(id, 25, pageNumber, correlationId);
    page.banners.forEach((banner) => {
      allBanners.push(banner);
    });
    pageNumber += 1;
    isMorePages = pageNumber <= page.totalNumberOfPages;
  }
  return allBanners;
};

const getBannerById = async (id, bid, correlationId) =>
  callApi(`services/${id}/banners/${bid}`, "GET", undefined, correlationId);

const upsertBanner = async (sid, banner, correlationId) =>
  callApi(`services/${sid}/banners`, "POST", banner, correlationId);

const removeBanner = async (sid, bid, correlationId) =>
  callApi(`services/${sid}/banners/${bid}`, "DELETE", undefined, correlationId);

module.exports = {
  updateService,
  listAllServices,
  listBannersForService,
  getBannerById,
  upsertBanner,
  removeBanner,
  listAllBannersForService,
};
