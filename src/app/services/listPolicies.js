const { getServiceById } = require('./../../infrastructure/applications');
const { getPageOfPoliciesForService } = require('./../../infrastructure/access');

const viewModel = async (req) => {
  const paramsSource = req.method === 'POST' ? req.body : req.query;
  let page = paramsSource.page ? parseInt(paramsSource.page) : 1;
  if (isNaN(page)) {
    page = 1;
  }

  const serviceDetails = await getServiceById(req.params.sid, req.id);
  const servicePolicies = await getPageOfPoliciesForService(req.params.sid, page, 25, req.id);
  const allUserRoles = req.userServices.roles.map((role) => ({
    serviceId: role.code.substr(0, role.code.indexOf('_')),
    role: role.code.substr(role.code.lastIndexOf('_') + 1),
  }));
  const userRolesForService = allUserRoles.filter(x => x.serviceId === req.params.sid);
  const manageRolesForService = userRolesForService.map(x => x.role);

  return {
    csrfToken: req.csrfToken(),
    backLink: true,
    serviceDetails,
    policies: servicePolicies.policies,
    page: servicePolicies.page,
    totalNumberOfResults: servicePolicies.totalNumberOfRecords,
    numberOfPages: servicePolicies.totalNumberOfPages,
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentPage: 'policies',
  }
};

const get = async (req, res) => {
  const model = await viewModel(req);
  return res.render('services/views/listPolicies', model);
};

const post = async (req, res) => {
  const model = await viewModel(req);
  return res.render('services/views/listPolicies', model);
};

module.exports = {
  get,
  post,
};
