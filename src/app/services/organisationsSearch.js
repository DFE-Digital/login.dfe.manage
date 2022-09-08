/* eslint-disable no-nested-ternary */
const { searchOrganisations } = require('../../infrastructure/organisations');
const { getServiceById } = require('../../infrastructure/applications');
const { getUserServiceRoles } = require('./utils');
const logger = require('../../infrastructure/logger');

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
  const results = await searchOrganisations(
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

  return {
    criteria: safeCriteria,
    pageNumber,
    sortBy,
    sortOrder: sortAsc ? 'asc' : 'desc',
    totalNumberOfPages: results.totalNumberOfPages,
    totalNumberOfRecords: results.totalNumberOfRecords,
    organisations: results.organisations,
    sort: {
      name: {
        nextDirection: sortBy === 'name' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'name',
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
  const service = await getServiceById(req.params.sid, req.id);
  const manageRolesForService = await getUserServiceRoles(req);
  const pageOfOrganisations = await search(req);

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
    serviceId: req.params.sid,
    service,
    userRoles: manageRolesForService,
    currentNavigation: 'organisations',
  };
};
const get = async (req, res) => {
  const model = await buildModel(req);
  return res.render('services/views/organisationsSearch', model);
};

const post = async (req, res) => {
  const model = await buildModel(req);
  return res.render('services/views/organisationsSearch', model);
};

module.exports = {
  get,
  post,
};
