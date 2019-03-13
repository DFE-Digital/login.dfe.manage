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
const { mapUserStatus } = require('./../../infrastructure/utils');

const callApi = async (endpoint, method, body, correlationId) => {
  const token = await jwtStrategy(config.search.service).getBearerToken();

  try {
    return await rp({
      method: method,
      uri: `${config.search.service.url}${endpoint}`,
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
    if (status === 404) {
      return undefined;
    }
    throw e;
  }
};

const mapSearchUserToSupportModel = (user) => {
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    organisation: user.primaryOrganisation ? {
      name: user.primaryOrganisation
    } : null,
    organisations: user.organisations,
    lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
    successfulLoginsInPast12Months: user.numberOfSuccessfulLoginsInPast12Months,
    status: mapUserStatus(user.statusId, user.statusLastChangedOn),
    pendingEmail: user.pendingEmail,
  };
};

const mapSupportUserSortByToSearchApi = (supportSortBy) => {
  switch (supportSortBy.toLowerCase()) {
    case 'name':
      return 'searchableName';
    case 'email':
      return 'searchableEmail';
    case 'organisation':
      return 'primaryOrganisation';
    case 'lastlogin':
      return 'lastLogin';
    case 'status':
      return 'statusId';
    default:
      throw new Error(`Unexpected user sort field ${supportSortBy}`);
  }
};

const searchForUsersForService = async (serviceId, criteria, pageNumber, sortBy, sortDirection) => {
  try {
    let endpoint = `/users?filter_services=${serviceId}&criteria=${criteria}&page=${pageNumber}`;
    if (sortBy) {
      endpoint += `&sortBy=${mapSupportUserSortByToSearchApi(sortBy)}`;
    }
    if (sortDirection) {
      endpoint += `&sortDirection=${sortDirection}`;
    }
    const results = await callApi(endpoint, 'GET');
    return {
      numberOfPages: results.numberOfPages,
      totalNumberOfResults: results.totalNumberOfResults,
      users: results.users.map(mapSearchUserToSupportModel)
    }
  } catch (e) {
    throw new Error(`Error searching for users with criteria ${criteria} (page: ${pageNumber}) - ${e.message}`);
  }
};

const getSearchDetailsForUserById = async (id) => {
  try {
    const user = await callApi(`/users/${id}`, 'GET');
    return user ? mapSearchUserToSupportModel(user) : undefined;
  } catch (e) {
    throw new Error(`Error getting user ${id} from search - ${e.message}`);
  }
};



module.exports = {
  searchForUsersForService,
  getSearchDetailsForUserById,
};
