const { getOrganisationByIdV2 } = require("../../infrastructure/organisations");
const {
  mapUserRole,
  mapSearchUserToSupportModel,
} = require("../../infrastructure/utils");
const { getUserServiceRoles } = require("./utils");
const { dateFormat } = require("../helpers/dateFormatterHelper");
const { getServiceRaw } = require("login.dfe.api-client/services");
const {
  UserSearchSortDirection,
  mapSupportUserSortByToSearchApi,
  searchUsersRaw,
} = require("login.dfe.api-client/users");

const search = async (req) => {
  const organisationId = req.params.oid;
  const paramsSource = req.method === "POST" ? req.body : req.query;

  let page = paramsSource.page ? parseInt(paramsSource.page, 10) : 1;
  if (Number.isNaN(page)) {
    page = 1;
  }

  const availableSortCriteria = ["name", "email", "lastlogin", "status"];

  const sortBy =
    paramsSource.sort &&
    availableSortCriteria.includes(paramsSource.sort.toLowerCase())
      ? paramsSource.sort.toLowerCase()
      : "name";
  const sortAsc =
    (paramsSource.sortDir ? paramsSource.sortDir : "asc").toLowerCase() ===
    "asc";

  const results = await searchUsersRaw({
    searchCriteria: "*",
    pageNumber: page,
    sortBy: mapSupportUserSortByToSearchApi({ sortBy }),
    sortDirection: sortAsc
      ? UserSearchSortDirection.asc
      : UserSearchSortDirection.desc,
    filterBy: {
      organisationIds: [organisationId],
    },
  });

  return {
    page,
    sortBy,
    sortOrder: sortAsc ? "asc" : "desc",
    numberOfPages: results.numberOfPages,
    totalNumberOfResults: results.totalNumberOfResults,
    users: results.users.map(mapSearchUserToSupportModel),
    sort: {
      name: {
        nextDirection: sortBy === "name" ? (sortAsc ? "desc" : "asc") : "asc",
        applied: sortBy === "name",
      },
      email: {
        nextDirection: sortBy === "email" ? (sortAsc ? "desc" : "asc") : "asc",
        applied: sortBy === "email",
      },
      lastLogin: {
        nextDirection:
          sortBy === "lastlogin" ? (sortAsc ? "desc" : "asc") : "asc",
        applied: sortBy === "lastlogin",
      },
      status: {
        nextDirection: sortBy === "status" ? (sortAsc ? "desc" : "asc") : "asc",
        applied: sortBy === "status",
      },
    },
  };
};

const render = async (req, res) => {
  const organisation = await getOrganisationByIdV2(req.params.oid, req.id);
  const manageRolesForService = await getUserServiceRoles(req);
  const service = await getServiceRaw({
    by: { serviceId: req.params.sid },
  });
  const result = await search(req);

  const users = result.users.map((user) => {
    const viewUser = { ...user };
    viewUser.organisation = {
      ...user.organisations.find(
        (o) => o.id.toUpperCase() === organisation.id.toUpperCase(),
      ),
    };
    viewUser.organisation.role = mapUserRole(viewUser.organisation.roleId);
    viewUser.formattedLastLogin = viewUser.lastLogin
      ? dateFormat(viewUser.lastLogin, "shortDateFormat")
      : "";
    return viewUser;
  });

  return res.render("services/views/organisationUserList", {
    csrfToken: req.csrfToken(),
    serviceId: req.params.sid,
    service,
    backLink: `/services/${req.params.sid}/organisations`,
    organisation,
    users,
    page: result.page,
    numberOfPages: result.numberOfPages,
    totalNumberOfResults: result.totalNumberOfResults,
    sortOrder: result.sortOrder,
    userRoles: manageRolesForService,
    sort: result.sort,
    sortBy: result.sortBy,
    currentNavigation: "organisations",
  });
};

const get = async (req, res) => render(req, res, req.query);
const post = async (req, res) => render(req, res, req.body);

module.exports = {
  get,
  post,
};
