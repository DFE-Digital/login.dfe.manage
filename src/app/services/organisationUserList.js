const { searchForUsers } = require('../../infrastructure/search');
const { getOrganisationByIdV2 } = require('../../infrastructure/organisations');
const { mapUserRole } = require('../../infrastructure/utils');
const { getUserServiceRoles } = require('./utils');
const { getServiceById } = require('../../infrastructure/applications');

const search = async (req) => {
  const organisationId = req.params.oid;
  const paramsSource = req.method === 'POST' ? req.body : req.query;

  let page = paramsSource.page ? parseInt(paramsSource.page, 10) : 1;
  if (isNaN(page)) {
    page = 1;
  }

  const availableSortCriteria = ['name', 'email', 'lastlogin', 'status'];

  const sortBy = (paramsSource.sort && availableSortCriteria.includes(paramsSource.sort.toLowerCase())) ? paramsSource.sort.toLowerCase() : 'name';
  const sortAsc = (paramsSource.sortDir ? paramsSource.sortDir : 'asc').toLowerCase() === 'asc';

  const results = await searchForUsers('*', page, sortBy, sortAsc ? 'asc' : 'desc', {
    organisations: [organisationId],
  });

  return {
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

const render = async (req, res) => {
  const organisation = await getOrganisationByIdV2(req.params.oid, req.id);
  const manageRolesForService = await getUserServiceRoles(req);
  const service = await getServiceById(req.params.sid, req.id);

  const result = await search(req);

  const users = result.users.map((user) => {
    const viewUser = { ...user };
    viewUser.organisation = { ...user.organisations.find((o) => o.id.toUpperCase() === organisation.id.toUpperCase()) };
    viewUser.organisation.role = mapUserRole(viewUser.organisation.roleId);
    return viewUser;
  });

  return res.render('services/views/organisationUserList', {
    csrfToken: req.csrfToken(),
    serviceId: req.params.sid,
    service,
    backLink: true,
    organisation,
    users,
    page: result.page,
    numberOfPages: result.numberOfPages,
    totalNumberOfResults: result.totalNumberOfResults,
    sortOrder: result.sortOrder,
    userRoles: manageRolesForService,
    sort: result.sort,
    sortBy: result.sortBy,
    currentNavigation: 'organisations',
  });
};

const get = async (req, res) => render(req, res, req.query);
const post = async (req, res) => render(req, res, req.body);

module.exports = {
  get,
  post,
};
