const jwtStrategy = require('login.dfe.jwt-strategies');
const config = require('./../config');
const KeepAliveAgent = require('agentkeepalive').HttpsAgent;
const rp = require('login.dfe.request-promise-retry').defaults({
  agent: new KeepAliveAgent({
    maxSockets: config.hostingEnvironment.agentKeepAlive.maxSockets,
    maxFreeSockets: config.hostingEnvironment.agentKeepAlive.maxFreeSockets,
    timeout: config.hostingEnvironment.agentKeepAlive.timeout,
    keepAliveTimeout: config.hostingEnvironment.agentKeepAlive.keepAliveTimeout,
  }),
});

const callOrganisationsApi = async (endpoint, method, body, correlationId) => {
  const token = await jwtStrategy(config.organisations.service).getBearerToken();

  try {
    return await rp({
      method: method,
      uri: `${config.organisations.service.url}/${endpoint}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: body,
      json: true,
      strictSSL: config.hostingEnvironment.env.toLowerCase() !== 'dev',
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

const getAllUserOrganisations = async (userId, correlationId) => {
  return await callOrganisationsApi(`organisations/associated-with-user/${userId}`, 'GET', undefined, correlationId);
};

const getInvitationOrganisations = async (invitationId, correlationId) => {
  return await callOrganisationsApi(`invitations/v2/${invitationId}`, 'GET', undefined, correlationId);
};

const searchOrganisations = async (criteria, filterByCategories, pageNumber, correlationId) => {
  let uri = `organisations?search=${criteria}&page=${pageNumber}`;
  if (filterByCategories) {
    filterByCategories.forEach((category) => {
      uri += `&filtercategory=${category}`;
    });
  }
  return await callOrganisationsApi(uri, 'GET', undefined, correlationId);
};

module.exports = {
  getInvitationOrganisations,
  getAllUserOrganisations,
  searchOrganisations,
};
