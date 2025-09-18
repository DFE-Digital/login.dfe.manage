const config = require("./../config");

const { fetchApi } = require("login.dfe.async-retry");
const jwtStrategy = require("login.dfe.jwt-strategies");

const callApi = async (method, endpoint, correlationId, body) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  try {
    return await fetchApi(`${config.access.service.url}/${endpoint}`, {
      method,
      headers: {
        authorization: `bearer ${token}`,
        "x-correlation-id": correlationId,
      },
      body: body,
    });
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 404) {
      return undefined;
    }
    throw e;
  }
};

const getServicesForUser = async (id, correlationId) => {
  return callApi("GET", `/users/${id}/services`, correlationId, undefined);
};

const getSingleUserService = async (id, sid, oid, correlationId) => {
  return callApi(
    "GET",
    `/users/${id}/services/${sid}/organisations/${oid}`,
    correlationId,
    undefined,
  );
};

const getSingleInvitationService = async (iid, sid, oid, correlationId) => {
  return callApi(
    "GET",
    `invitations/${iid}/services/${sid}/organisations/${oid}`,
    correlationId,
    undefined,
  );
};

const getAllInvitationServices = async (iid, correlationId) =>
  callApi("GET", `invitations/${iid}/services`, correlationId, undefined);

const listRolesOfService = async (sid, correlationId) => {
  return callApi("GET", `services/${sid}/roles`, correlationId, undefined);
};

const updateRole = async (serviceId, roleId, roleBody, correlationId) => {
  return callApi(
    "PATCH",
    `services/${serviceId}/roles/${roleId}`,
    correlationId,
    roleBody,
  );
};

module.exports = {
  getServicesForUser,
  getSingleUserService,
  getSingleInvitationService,
  listRolesOfService,
  updateRole,
  getAllInvitationServices,
};
