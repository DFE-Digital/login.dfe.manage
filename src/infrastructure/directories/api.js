const config = require('./../config');
const { fetchApi } = require('login.dfe.async-retry');
const jwtStrategy = require('login.dfe.jwt-strategies');

const getInvitation = async (invitationId, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    const invitation = await fetchApi(`${config.directories.service.url}/invitations/${invitationId}`,{
      method: 'GET',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    });

    return invitation;
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 404) {
      return null;
    }
    throw e;
  }
};

const getUsersByIdV2 = async (ids, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();
  try {
    return await rp({
      method: 'POST',
      uri: `${config.directories.service.url}/users/by-ids`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: {
        ids: ids.toString(),
      },
      json: true,
    });
  } catch (e) {
    if (e.statusCode === 404) {
      return null;
    }
    throw e;
  }
};

const getUserById = async (uid, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    return await rp({
      method: 'GET',
      uri: `${config.directories.service.url}/users/${uid}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    });
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 404) {
      return null;
    }
    throw e;
  }
};

const getInvitationByEmail = async (email, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    return await rp({
      method: 'GET',
      uri: `${config.directories.service.url}/invitations/by-email/${email}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    });
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 404) {
      return null;
    }
    throw e;
  }
};

const createInvite = async (firstName, lastName, email, clientId, redirectUri, correlationId, isApprover, orgName) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  const body = {
    firstName,
    lastName,
    email,
    isApprover,
    orgName,
    origin: {
      clientId,
      redirectUri,
    },
  };

  const invitation = await rp({
    method: 'POST',
    uri: `${config.directories.service.url}/invitations`,
    headers: {
      authorization: `bearer ${token}`,
      'x-correlation-id': correlationId,
    },
    body,
    json: true,
  });

  return invitation.id;
};

const resendInvitation = async (id, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    await rp({
      method: 'POST',
      uri: `${config.directories.service.url}/invitations/${id}/resend`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    });
    return true;
  } catch (e) {
    if (e.statusCode === 404) {
      return null;
    }
    throw e;
  }
};

const updateInvite = async (id, email, correlationId) => {
  try {
    const token = await jwtStrategy(config.directories.service).getBearerToken();
    await rp({
      method: 'PATCH',
      uri: `${config.directories.service.url}/invitations/${id}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: {
        email,
      },
      json: true,
    })
  } catch (e) {
    if (e.statusCode === 404) {
      return null;
    }
    throw e;
  }
};

module.exports = {
  getInvitation,
  getUsersByIdV2,
  getUserById,
  getInvitationByEmail,
  createInvite,
  resendInvitation,
  updateInvite,
};
