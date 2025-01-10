const jwtStrategy = require("login.dfe.jwt-strategies");
const config = require("./../config");
const { fetchApi } = require("login.dfe.async-retry");

const mapOrgSortByToSearchApi = (supportSortBy) => {
  switch (supportSortBy.toLowerCase()) {
    case "name":
      return "name";
    case "legalname":
      return "legalname";
    case "type":
      return "category";
    case "urn":
      return "urn";
    case "uid":
      return "uid";
    case "upin":
      return "upin";
    case "ukprn":
      return "ukprn";
    case "status":
      return "status";
    default:
      throw new Error(`Unexpected user sort field ${supportSortBy}`);
  }
};

const buildOrgSearchUri = (baseUri, options) => {
  const {
    criteria,
    pageNumber,
    sortBy,
    sortDirection,
    filterByCategories,
    filterByStatus,
  } = options;

  const uriParams = [`search=${criteria}`, `page=${pageNumber}`];

  if (sortBy) {
    uriParams.push(`sortBy=${mapOrgSortByToSearchApi(sortBy)}`);
  }

  if (sortDirection) {
    uriParams.push(`sortDirection=${sortDirection}`);
  }

  if (filterByCategories && filterByCategories.length > 0) {
    const categoryParams = filterByCategories.map(
      (category) => `filtercategory=${category}`,
    );
    uriParams.push(...categoryParams);
  }

  if (filterByStatus && filterByStatus.length > 0) {
    const statusParams = filterByStatus.map(
      (status) => `filterstatus=${status}`,
    );
    uriParams.push(...statusParams);
  }

  return `${baseUri}?${uriParams.join("&")}`;
};

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

const getAllUserOrganisations = async (userId, correlationId) => {
  return await callOrganisationsApi(
    `organisations/associated-with-user/${userId}`,
    "GET",
    undefined,
    correlationId,
  );
};

const getInvitationOrganisations = async (invitationId, correlationId) => {
  return await callOrganisationsApi(
    `invitations/v2/${invitationId}`,
    "GET",
    undefined,
    correlationId,
  );
};

const searchOrganisations = async (
  criteria,
  filterByCategories,
  pageNumber,
  sortBy,
  sortDirection,
  correlationId,
  filterByStatus,
) => {
  const uri = buildOrgSearchUri("organisations", {
    criteria,
    filterByCategories,
    pageNumber,
    sortBy,
    sortDirection,
    filterByStatus,
  });
  return callOrganisationsApi(uri, "GET", undefined, correlationId);
};

const searchOrgsAssociatedWithService = async (
  serviceId,
  criteria,
  pageNumber,
  sortBy,
  sortDirection,
  correlationId,
  filterByCategories,
  filterByStatus,
) => {
  const baseUri = `organisations/associated-with-service/${serviceId}`;
  const uri = buildOrgSearchUri(baseUri, {
    criteria,
    filterByCategories,
    pageNumber,
    sortBy,
    sortDirection,
    filterByStatus,
  });
  return callOrganisationsApi(uri, "GET", undefined, correlationId);
};

const getOrganisationById = async (id, correlationId) => {
  return await callOrganisationsApi(
    `organisations/${id}`,
    "GET",
    undefined,
    correlationId,
  );
};

const getUserOrganisations = async (userId, correlationId) => {
  return await callOrganisationsApi(
    `organisations/associated-with-user/${userId}`,
    "GET",
    undefined,
    correlationId,
  );
};

const getOrganisationByIdV2 = async (id, correlationId) => {
  return await callOrganisationsApi(
    `organisations/v2/${id}`,
    "GET",
    undefined,
    correlationId,
  );
};

const getOrganisationForUserV2 = async (userId, correlationId) => {
  return await callOrganisationsApi(
    `organisations/v2/associated-with-user/${userId}`,
    "GET",
    undefined,
    correlationId,
  );
};

const putInvitationInOrganisation = async (
  invitationId,
  organisationId,
  role,
  correlationId,
) => {
  return callOrganisationsApi(
    `organisations/${organisationId}/invitations/${invitationId}`,
    "PUT",
    { roleId: role },
    correlationId,
  );
};

const putUserInOrganisation = async (
  userId,
  organisationId,
  role,
  correlationId,
) => {
  return callOrganisationsApi(
    `organisations/${organisationId}/users/${userId}`,
    "PUT",
    { roleId: role },
    correlationId,
  );
};

const getPendingRequestsAssociatedWithUser = async (userId, correlationId) => {
  return callOrganisationsApi(
    `/organisations/requests-for-user/${userId}`,
    "GET",
    undefined,
    correlationId,
  );
};

const updateRequestById = async (
  requestId,
  status,
  actionedBy,
  actionedReason,
  actionedAt,
  correlationId,
) => {
  const body = {};
  if (status) {
    body.status = status;
  }
  if (actionedBy) {
    body.actioned_by = actionedBy;
  }
  if (actionedReason) {
    body.actioned_reason = actionedReason;
  }
  if (actionedAt) {
    body.actioned_at = actionedAt;
  }
  return callOrganisationsApi(
    `/organisations/requests/${requestId}`,
    "PATCH",
    body,
    correlationId,
  );
};

const getOrganisationCategories = async (correlationId) =>
  callOrganisationsApi(
    "organisations/categories",
    "GET",
    undefined,
    correlationId,
  );

const listOrganisationStatus = async (correlationId) =>
  callOrganisationsApi("organisations/states", "GET", undefined, correlationId);

module.exports = {
  getInvitationOrganisations,
  getAllUserOrganisations,
  searchOrganisations,
  getOrganisationById,
  getUserOrganisations,
  getOrganisationByIdV2,
  getOrganisationForUserV2,
  putInvitationInOrganisation,
  putUserInOrganisation,
  getPendingRequestsAssociatedWithUser,
  updateRequestById,
  searchOrgsAssociatedWithService,
  getOrganisationCategories,
  listOrganisationStatus,
};
