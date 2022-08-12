const { searchForUsers } = require('../../infrastructure/search');
const logger = require('../../infrastructure/logger');
const { getServiceById } = require('../../infrastructure/applications');
const { getUserServiceRoles } = require('./utils');

const clearNewUserSessionData = (req) => {
  if (req.session.user) {
    req.session.user = undefined;
  }
};

const search = async (req) => {
  const paramsSource = req.method === 'POST' ? req.body : req.query;

  let { criteria } = paramsSource;
  if (!criteria) {
    criteria = '';
  }
  const safeCriteria = criteria;
  if (criteria.indexOf('-') !== -1) {
    criteria = "\"" + criteria + "\"";
  }

  let page = paramsSource.page ? parseInt(paramsSource.page, 10) : 1;
  if (isNaN(page)) {
    page = 1;
  }

  const sortBy = paramsSource.sort ? paramsSource.sort.toLowerCase() : 'name';
  const sortAsc = (paramsSource.sortdir ? paramsSource.sortdir : 'asc').toLowerCase() === 'asc';

  const results = await searchForUsers(`${criteria}*`, page, sortBy, sortAsc ? 'asc' : 'desc', {});

  logger.audit(`${req.user.email} (id: ${req.user.sub}) searched for users in manage using criteria "${criteria}"`, {
    type: 'manage',
    subType: 'user-search',
    userId: req.user.sub,
    userEmail: req.user.email,
    criteria,
    pageNumber: page,
    numberOfPages: results.numberOfPages,
    sortedBy: sortBy,
    sortDirection: sortAsc ? 'asc' : 'desc',
  });

  return {
    criteria: safeCriteria,
    page,
    sortBy,
    sortOrder: sortAsc ? 'asc' : 'desc',
    numberOfPages: results.numberOfPages,
    totalNumberOfResults: results.totalNumberOfResults,
    users: results.users,
    sort: {
      name: {
        nextDirection: sortBy === 'name' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'name',
      },
      email: {
        nextDirection: sortBy === 'email' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'email',
      },
      organisation: {
        nextDirection: sortBy === 'organisation' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'organisation',
      },
      lastLogin: {
        nextDirection: sortBy === 'lastlogin' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'lastlogin',
      },
      status: {
        nextDirection: sortBy === 'status' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'status',
      },
    },
  };
};

const viewModel = async (req) => {
  const result = await search(req);
  const service = await getServiceById(req.params.sid, req.id);
  const manageRolesForService = await getUserServiceRoles(req);

  return {
    csrfToken: req.csrfToken(),
    serviceId: req.params.sid,
    backLink: `/services/${req.params.sid}`,
    criteria: result.criteria,
    page: result.page,
    numberOfPages: result.numberOfPages,
    totalNumberOfResults: result.totalNumberOfResults,
    users: result.users,
    sort: result.sort,
    sortBy: result.sortBy,
    sortOrder: result.sortOrder,
    service,
    userRoles: manageRolesForService,
    currentNavigation: 'users',
  };
};

const get = async (req, res) => {
  clearNewUserSessionData(req);
  const model = await viewModel(req);
  return res.render('services/views/usersSearch', model);
};

const post = async (req, res) => {
  const model = await viewModel(req);
  return res.render('services/views/usersSearch', model);
};

module.exports = {
  get,
  post,
};
