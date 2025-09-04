const { searchForUsers } = require("../../infrastructure/search");
const logger = require("../../infrastructure/logger");
const { getServiceRaw } = require("login.dfe.api-client/services");
const {
  userStatusMap,
  lastLoginIntervalsMap,
} = require("../../infrastructure/utils/index");
const {
  getUserServiceRoles,
  unpackMultiSelect,
  buildFilters,
  isSelected,
  getParamsSource,
  objectToQueryString,
  mapLastLoginValuesToDateValues,
} = require("./utils");
const { dateFormat } = require("../helpers/dateFormatterHelper");
const {
  getOrganisationCategories,
} = require("../../infrastructure/organisations");

const clearNewUserSessionData = (req) => {
  if (req.session.user) {
    req.session.user = undefined;
  }
};

const search = async (req) => {
  const serviceId = req.params.sid;
  const paramsSource = req.method === "POST" ? req.body : req.query;

  let filters = buildFilters(
    paramsSource,
    "organisationCategories",
    "lastLogin",
    "statusId",
  );

  let { criteria } = paramsSource;
  if (!criteria) {
    criteria = "";
  }
  const safeCriteria = criteria;
  if (criteria.indexOf("-") !== -1) {
    criteria = `"${criteria}"`;
  }

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
  const showServices =
    paramsSource.showServices || paramsSource.services || "all";

  if (showServices === "current") {
    filters = { ...filters, services: [serviceId] };
  }

  let mappedToDateFilters = { ...filters };

  if (
    Object.prototype.hasOwnProperty.call(filters, "lastLogin") &&
    filters.lastLogin.length > 0
  ) {
    const mappedLoginIntervalsToDates = mapLastLoginValuesToDateValues(
      filters.lastLogin,
    );
    mappedToDateFilters = {
      ...mappedToDateFilters,
      lastLogin: mappedLoginIntervalsToDates,
    };
  }

  const results = await searchForUsers(
    `${encodeURIComponent(criteria)}*`,
    page,
    sortBy,
    sortAsc ? "asc" : "desc",
    mappedToDateFilters,
  );

  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) searched for users in manage using criteria "${criteria}"`,
    {
      type: "manage",
      subType: "user-search",
      userId: req.user.sub,
      userEmail: req.user.email,
      criteria,
      pageNumber: page,
      numberOfPages: results.numberOfPages,
      sortedBy: sortBy,
      sortDirection: sortAsc ? "asc" : "desc",
      filters,
    },
  );

  return {
    criteria: safeCriteria,
    page,
    sortBy,
    sortOrder: sortAsc ? "asc" : "desc",
    numberOfPages: results.numberOfPages,
    totalNumberOfResults: results.totalNumberOfResults,
    users: results.users,
    services: showServices,
    selectedOrganisationCategories: filters.organisationCategories,
    selectedLastLoginIntervals: filters.lastLogin,
    selectedAccountStatuses: filters.statusId,
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

const getFiltersModel = async (req) => {
  const { method, body, query, id } = req;
  const paramsSource = getParamsSource(method, body, query);

  const showFilters =
    paramsSource && paramsSource.showFilters
      ? paramsSource.showFilters.toLowerCase() === "true"
      : false;

  let organisationCategories = [];
  let lastLoginIntervals = [];
  let accountStatuses = [];

  if (showFilters) {
    const selectedOrganisationCategories = unpackMultiSelect(
      paramsSource.organisationCategories,
    );

    organisationCategories = (await getOrganisationCategories(id)).map(
      (category) => ({
        id: category.id,
        name: category.name,
        isSelected: isSelected(selectedOrganisationCategories, category.id),
      }),
    );

    const selectedLastLoginIntervals = unpackMultiSelect(
      paramsSource.lastLogin,
    );
    lastLoginIntervals = lastLoginIntervalsMap.map((interval) => ({
      id: interval.id,
      name: interval.name,
      isSelected:
        selectedLastLoginIntervals.find((x) => x === interval.id.toString()) !==
        undefined,
    }));

    const selectedAccountStatuses = unpackMultiSelect(paramsSource.statusId);
    accountStatuses = userStatusMap.map((status) => ({
      id: status.id,
      name: status.name,
      isSelected:
        selectedAccountStatuses.find((x) => x === status.id.toString()) !==
        undefined,
    }));
  }

  return {
    showFilters,
    organisationCategories,
    accountStatuses,
    lastLoginIntervals,
  };
};

const viewModel = async (req) => {
  const result = await search(req);
  const service = await getServiceRaw({
    by: { serviceId: req.params.sid },
  });
  const manageRolesForService = await getUserServiceRoles(req);

  // remove hidden organisations from displaying
  const users = result.users.map((u) => ({
    ...u,
    organisations: u.organisations.filter(
      (o) => o.statusId && o.statusId !== 0,
    ),
    formattedLastLogin: u.lastLogin
      ? dateFormat(u.lastLogin, "shortDateFormat")
      : "",
  }));
  const filtersModel = await getFiltersModel(req);
  return {
    csrfToken: req.csrfToken(),
    serviceId: req.params.sid,
    backLink: `/services/${req.params.sid}`,
    criteria: result.criteria,
    page: result.page,
    numberOfPages: result.numberOfPages,
    totalNumberOfResults: result.totalNumberOfResults,
    users,
    sort: result.sort,
    sortBy: result.sortBy,
    sortOrder: result.sortOrder,
    service,
    services: result.services,
    userRoles: manageRolesForService,
    currentNavigation: "users",
    selectedOrganisationCategories: result.selectedOrganisationCategories,
    selectedLastLoginIntervals: result.selectedLastLoginIntervals,
    selectedAccountStatuses: result.selectedAccountStatuses,
    ...filtersModel,
  };
};

const get = async (req, res) => {
  clearNewUserSessionData(req);
  const model = await viewModel(req);
  return res.render("services/views/usersSearch", model);
};

const post = async (req, res) => {
  const model = await viewModel(req);
  const queryParameters = {
    page: model.page,
    criteria: model.criteria,
    sort: model.sortBy,
    sortDir: model.sortOrder,
    showServices: model.services,
    showFilters: model.showFilters,
    organisationCategories: model.selectedOrganisationCategories,
    lastLogin: model.selectedLastLoginIntervals,
    statusId: model.selectedAccountStatuses,
  };
  const query = objectToQueryString(queryParameters);
  return res.redirect(`?${query}`);
};

module.exports = {
  get,
  post,
};
