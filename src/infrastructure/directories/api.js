const config = require("./../config");
const { fetchApi } = require("login.dfe.async-retry");
const jwtStrategy = require("login.dfe.jwt-strategies");

const resendInvitation = async (id, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    await fetchApi(
      `${config.directories.service.url}/invitations/${id}/resend`,
      {
        method: "POST",
        headers: {
          authorization: `bearer ${token}`,
          "x-correlation-id": correlationId,
        },
      },
    );
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
    const token = await jwtStrategy(
      config.directories.service,
    ).getBearerToken();
    await fetchApi(`${config.directories.service.url}/invitations/${id}`, {
      method: "PATCH",
      headers: {
        authorization: `bearer ${token}`,
        "x-correlation-id": correlationId,
      },
      body: {
        email,
      },
    });
  } catch (e) {
    if (e.statusCode === 404) {
      return null;
    }
    throw e;
  }
};

module.exports = {
  resendInvitation,
  updateInvite,
};
