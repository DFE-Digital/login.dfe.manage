const { getServiceRaw } = require("login.dfe.api-client/services");
const {
  getOrganisationStatuses,
  getOrganisationCategories,
  searchOrganisationsRaw,
  searchOrganisationsAssociatedWithServiceRaw,
} = require("login.dfe.api-client/organisations");
const {
  getUserServiceRoles,
  unpackMultiSelect,
  isSelected,
  getSortInfo,
  getParamsSource,
  getValidPageNumber,
  objectToQueryString,
} = require("./utils");
const logger = require("../../infrastructure/logger");

const getFiltersModel = async (req, organisationCategories, orgStatuses) => {
  const { method, body, query } = req;
  const paramsSource = getParamsSource(method, body, query);

  const showFilters =
    paramsSource && paramsSource.showFilters
      ? paramsSource.showFilters.toLowerCase() === "true"
      : false;

  let organisationTypes = [];
  let organisationStatuses = [];

  if (showFilters) {
    const selectedOrganisationTypes = unpackMultiSelect(
      paramsSource.organisationType,
    );
    const selectedOrganisationStatus = unpackMultiSelect(
      paramsSource.organisationStatus,
    );
    if (
      paramsSource &&
      paramsSource.showOrganisations === "currentService" &&
      organisationCategories
    ) {
      organisationTypes = organisationCategories.map((category) => ({
        id: category.id,
        name: category.name,
        isSelected: isSelected(selectedOrganisationTypes, category.id),
      }));
    } else {
      organisationTypes = (await getOrganisationCategories()).map(
        (category) => ({
          id: category.id,
          name: category.name,
          isSelected: isSelected(selectedOrganisationTypes, category.id),
        }),
      );
    }
    if (
      paramsSource &&
      paramsSource.showOrganisations === "currentService" &&
      orgStatuses
    ) {
      organisationStatuses = orgStatuses.map((status) => ({
        id: status.id,
        name: status.name,
        isSelected: isSelected(
          selectedOrganisationStatus,
          status.id.toString(),
        ),
      }));
    } else {
      organisationStatuses = (await getOrganisationStatuses()).map(
        (status) => ({
          id: status.id,
          name: status.name,
          isSelected: selectedOrganisationStatus.includes(status.id.toString()),
        }),
      );
    }
  }

  return {
    showFilters,
    organisationTypes,
    organisationStatuses,
  };
};

const search = async (req) => {
  const { method, body, query } = req;
  const paramsSource = getParamsSource(method, body, query);
  const criteria = paramsSource.criteria || "";

  const safeCriteria = criteria;

  const pageNumber = getValidPageNumber(paramsSource.page);

  const orgTypes = unpackMultiSelect(paramsSource.organisationType);
  const orgStatuses = unpackMultiSelect(paramsSource.organisationStatus);

  const sortKeys = [
    "name",
    "LegalName",
    "type",
    "urn",
    "uid",
    "upin",
    "ukprn",
    "status",
  ];

  const { sortBy, sortAsc, sort } = getSortInfo(paramsSource, sortKeys);
  const showOrganisations = paramsSource.showOrganisations
    ? paramsSource.showOrganisations
    : "all";
  let results;
  if (showOrganisations === "currentService") {
    results = await searchOrganisationsAssociatedWithServiceRaw({
      serviceId: req.params.sid,
      organisationName: safeCriteria,
      categories: orgTypes,
      pageNumber,
      sortBy,
      sortDirection: sortAsc ? "asc" : "desc",
      status: orgStatuses,
    });
    logger.audit(
      `${req.user.email} (id: ${req.user.sub}) searched for organisations associated with service (sid: ${req.params.sid}) in manage using criteria "${criteria}"`,
      {
        type: "manage",
        subType: "organisation-search",
        userId: req.user.sub,
        userEmail: req.user.email,
        criteria,
        pageNumber,
        numberOfPages: results.totalNumberOfPages,
        sortedBy: sortBy,
        sortDirection: sortAsc ? "asc" : "desc",
      },
    );
  } else {
    results = await searchOrganisationsRaw({
      organisationName: safeCriteria,
      categories: orgTypes,
      pageNumber,
      sortBy,
      sortDirection: sortAsc ? "asc" : "desc",
      status: orgStatuses,
    });
    logger.audit(
      `${req.user.email} (id: ${req.user.sub}) searched for organisations in manage using criteria "${criteria}"`,
      {
        type: "manage",
        subType: "organisation-search",
        userId: req.user.sub,
        userEmail: req.user.email,
        criteria,
        pageNumber,
        numberOfPages: results.totalNumberOfPages,
        sortedBy: sortBy,
        sortDirection: sortAsc ? "asc" : "desc",
      },
    );
  }

  return {
    criteria: safeCriteria,
    pageNumber,
    sortBy,
    sortOrder: sortAsc ? "asc" : "desc",
    totalNumberOfPages: results.totalNumberOfPages,
    totalNumberOfRecords: results.totalNumberOfRecords,
    organisationCategories: results.organisationCategories,
    organisationStatuses: results.organisationStatuses,
    organisations: results.organisations,
    serviceOrganisations: showOrganisations,
    selectedOrgStatuses: orgStatuses,
    selectedOrgTypes: orgTypes,
    sort,
  };
};

const buildModel = async (req) => {
  const [service, manageRolesForService, pageOfOrganisations] =
    await Promise.all([
      getServiceRaw({
        by: { serviceId: req.params.sid },
      }),
      getUserServiceRoles(req),
      search(req),
    ]);

  const filtersModel = await getFiltersModel(
    req,
    pageOfOrganisations.organisationCategories,
    pageOfOrganisations.organisationStatuses,
  );

  return {
    csrfToken: req.csrfToken(),
    backLink: `/services/${req.params.sid}`,
    criteria: pageOfOrganisations.criteria,
    sort: pageOfOrganisations.sort,
    sortBy: pageOfOrganisations.sortBy,
    sortOrder: pageOfOrganisations.sortOrder,
    page: pageOfOrganisations.pageNumber,
    numberOfPages: pageOfOrganisations.totalNumberOfPages,
    totalNumberOfResults: pageOfOrganisations.totalNumberOfRecords,
    organisations: pageOfOrganisations.organisations,
    serviceOrganisations: pageOfOrganisations.serviceOrganisations,
    selectedOrgStatuses: pageOfOrganisations.selectedOrgStatuses,
    selectedOrgTypes: pageOfOrganisations.selectedOrgTypes,

    serviceId: req.params.sid,
    service,
    userRoles: manageRolesForService,
    currentNavigation: "organisations",
    ...filtersModel,
  };
};
const get = async (req, res) => {
  const model = await buildModel(req);
  return res.render("services/views/organisationsSearch", model);
};

const post = async (req, res) => {
  const model = await buildModel(req);
  const queryParameters = {
    page: model.page,
    showOrganisations: model.serviceOrganisations,
    criteria: model.criteria,
    sort: model.sortBy,
    sortDir: model.sortOrder,
    showFilters: model.showFilters,
    organisationStatus: model.selectedOrgStatuses,
    organisationType: model.selectedOrgTypes,
  };

  const query = objectToQueryString(queryParameters);
  return res.redirect(`?${query}`);
};

module.exports = {
  get,
  post,
};
