/* eslint-disable no-nested-ternary */
const {
  searchOrganisations, searchOrgsAssociatedWithService, getOrganisationCategories,
  listOrganisationStatus,
} = require('../../infrastructure/organisations');
const { getServiceById } = require('../../infrastructure/applications');
const { getUserServiceRoles, unpackMultiSelect, isSelected } = require('./utils');
const logger = require('../../infrastructure/logger');

const getFiltersModel = async (req, organisationCategories) => {
  const {
    method, body, query, id,
  } = req;
  const paramsSource = method === 'POST' ? body : query;

  const showFilters = paramsSource && paramsSource.showFilters
    ? paramsSource.showFilters.toLowerCase() === 'true'
    : false;

  let organisationTypes = [];
  let organisationStatuses = [];

  if (showFilters) {
    const selectedOrganisationTypes = unpackMultiSelect(paramsSource.organisationType);
    const selectedOrganisationStatus = unpackMultiSelect(paramsSource.organisationStatus);
    if (paramsSource && paramsSource.showOrganisations === 'currentService' && organisationCategories) {
      organisationTypes = organisationCategories.map((category) => ({
        id: category.id,
        name: category.name,
        isSelected: isSelected(selectedOrganisationTypes, category.id),
      }));
    } else {
      organisationTypes = (await getOrganisationCategories(id)).map((category) => ({
        id: category.id,
        name: category.name,
        isSelected: isSelected(selectedOrganisationTypes, category.id),
      }));
    }

    organisationStatuses = (await listOrganisationStatus(id)).map((status) => ({
      id: status.id,
      name: status.name,
      isSelected: selectedOrganisationStatus.includes(status.id.toString()),
    }));
  }

  return {
    showFilters,
    organisationTypes,
    organisationStatuses,
  };
};

const search = async (req) => {
  const paramsSource = req.method.toUpperCase() === 'POST' ? req.body : req.query;
  let { criteria } = paramsSource;
  if (!criteria) {
    criteria = '';
  }
  const safeCriteria = criteria;
  if (criteria.indexOf('-') !== -1) {
    criteria = `"${criteria}"`;
  }
  let pageNumber = parseInt(paramsSource.page, 10) || 1;
  // eslint-disable-next-line no-restricted-globals
  if (isNaN(pageNumber)) {
    pageNumber = 1;
  }
  const sortBy = paramsSource.sort ? paramsSource.sort.toLowerCase() : 'name';
  const sortAsc = (paramsSource.sortDir ? paramsSource.sortDir : 'asc').toLowerCase() === 'asc';
  const showOrganisations = paramsSource.showOrganisations ? paramsSource.showOrganisations : 'all';
  let results;
  if (showOrganisations === 'currentService') {
    results = await searchOrgsAssociatedWithService(
      req.params.sid,
      safeCriteria,
      pageNumber,
      sortBy,
      sortAsc ? 'asc' : 'desc',
      req.id,
    );
    logger.audit(`${req.user.email} (id: ${req.user.sub}) searched for organisations associated with service (sid: ${req.params.sid}) in manage using criteria "${criteria}"`, {
      type: 'manage',
      subType: 'organisation-search',
      userId: req.user.sub,
      userEmail: req.user.email,
      criteria,
      pageNumber,
      numberOfPages: results.numberOfPages,
      sortedBy: sortBy,
      sortDirection: sortAsc ? 'asc' : 'desc',
    });
  } else {
    results = await searchOrganisations(
      safeCriteria,
      undefined,
      pageNumber,
      sortBy,
      sortAsc ? 'asc' : 'desc',
      req.id,
    );
    logger.audit(`${req.user.email} (id: ${req.user.sub}) searched for organisations in manage using criteria "${criteria}"`, {
      type: 'manage',
      subType: 'organisation-search',
      userId: req.user.sub,
      userEmail: req.user.email,
      criteria,
      pageNumber,
      numberOfPages: results.numberOfPages,
      sortedBy: sortBy,
      sortDirection: sortAsc ? 'asc' : 'desc',
    });
  }

  return {
    criteria: safeCriteria,
    pageNumber,
    sortBy,
    sortOrder: sortAsc ? 'asc' : 'desc',
    totalNumberOfPages: results.totalNumberOfPages,
    totalNumberOfRecords: results.totalNumberOfRecords,
    organisationCategories: results.organisationCategories,
    organisations: results.organisations,
    serviceOrganisations: showOrganisations,
    sort: {
      name: {
        nextDirection: sortBy === 'name' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'name',
      },
      legalname: {
        nextDirection: sortBy === 'LegalName' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'LegalName',
      },
      type: {
        nextDirection: sortBy === 'type' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'type',
      },
      urn: {
        nextDirection: sortBy === 'urn' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'urn',
      },
      uid: {
        nextDirection: sortBy === 'uid' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'uid',
      },
      upin: {
        nextDirection: sortBy === 'upin' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'upin',
      },
      ukprn: {
        nextDirection: sortBy === 'ukprn' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'ukprn',
      },
      status: {
        nextDirection: sortBy === 'status' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'status',
      },
    },
  };
};

const buildModel = async (req) => {
  const [service, manageRolesForService, pageOfOrganisations] = await Promise.all([
    getServiceById(req.params.sid, req.id),
    getUserServiceRoles(req),
    search(req),
  ]);

  const filtersModel = await getFiltersModel(req, pageOfOrganisations.organisationCategories);

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
    serviceId: req.params.sid,
    service,
    userRoles: manageRolesForService,
    currentNavigation: 'organisations',
    ...filtersModel,
  };
};
const get = async (req, res) => {
  const model = await buildModel(req);
  return res.render('services/views/organisationsSearch', model);
};

const post = async (req, res) => {
  const model = await buildModel(req);
  return res.redirect(`?page=${model.page}&showOrganisations=${model.serviceOrganisations}&criteria=${model.criteria}&sort=${model.sortBy}&sortDir=${model.sortOrder}&showFilters=${model.showFilters}`);
};

module.exports = {
  get,
  post,
};
