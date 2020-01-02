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

const getOrganisationByIdV2 = async (id, correlationId) => {
  return await callOrganisationsApi(`organisations/v2/${id}`, 'GET', undefined, correlationId);
};

const getOrganisationForUserV2 = async (userId, correlationId) => {
  return await callOrganisationsApi( `organisations/v2/associated-with-user/${userId}`,'GET', undefined, correlationId);
};

const putInvitationInOrganisation = async (invitationId, organisationId, role, correlationId) => {
  return callOrganisationsApi(`organisations/${organisationId}/invitations/${invitationId}`, 'PUT', { roleId: role }, correlationId);
};

const putUserInOrganisation = async (userId, organisationId, role, correlationId) => {
  return callOrganisationsApi(`organisations/${organisationId}/users/${userId}`, 'PUT', { roleId: role }, correlationId);
};

const getPendingRequestsAssociatedWithUser = async (userId, correlationId) => {
  return callOrganisationsApi(`/organisations/requests-for-user/${userId}`, 'GET', undefined, correlationId);
};

const updateRequestById = async (requestId, status, actionedBy, actionedReason, actionedAt, correlationId) => {
  const body = {};
  if (status) {
    body.status = status
  }
  if (actionedBy) {
    body.actioned_by = actionedBy
  }
  if (actionedReason) {
    body.actioned_reason = actionedReason
  }
  if (actionedAt) {
    body.actioned_at = actionedAt
  }
  return callOrganisationsApi( `/organisations/requests/${requestId}`, 'PATCH', body, correlationId);
};

module.exports = {
  getInvitationOrganisations,
  getAllUserOrganisations,
  searchOrganisations,
  getOrganisationByIdV2,
  getOrganisationForUserV2,
  putInvitationInOrganisation,
  putUserInOrganisation,
  getPendingRequestsAssociatedWithUser,
  updateRequestById,
};
