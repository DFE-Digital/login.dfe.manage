const jwtStrategy = require("login.dfe.jwt-strategies");
const config = require("./../config");
const { fetchApi } = require("login.dfe.async-retry");

const callOrganisationsApi = async (endpoint, method, body, correlationId) => {
  const token = await jwtStrategy(
    config.organisations.service,
  ).getBearerToken();

  try {
    return await fetchApi(`${config.organisations.service.url}/${endpoint}`, {
      method: method,
      headers: {
        authorization: `bearer ${token}`,
        "x-correlation-id": correlationId,
      },
      body: body,
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

const getOrganisationById = async (id, correlationId) => {
  return await callOrganisationsApi(
    `organisations/${id}`,
    "GET",
    undefined,
    correlationId,
  );
};

module.exports = {
  getOrganisationById,
};
