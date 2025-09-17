const {
  getServiceRaw,
  getPaginatedServicePoliciesRaw,
} = require("login.dfe.api-client/services");
const { getUserServiceRoles } = require("./utils");

const viewModel = async (req) => {
  const paramsSource = req.method === "POST" ? req.body : req.query;
  let page = paramsSource.page ? parseInt(paramsSource.page) : 1;
  if (isNaN(page)) {
    page = 1;
  }

  const serviceDetails = await getServiceRaw({
    by: { serviceId: req.params.sid },
  });
  const servicePolicies = await getPaginatedServicePoliciesRaw({
    serviceId: req.params.sid,
    page: page,
    pageSize: 25,
  });
  const manageRolesForService = await getUserServiceRoles(req);

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
    currentNavigation: "policies",
  };
};

const get = async (req, res) => {
  const model = await viewModel(req);
  return res.render("services/views/listPolicies", model);
};

const post = async (req, res) => {
  const model = await viewModel(req);
  return res.render("services/views/listPolicies", model);
};

module.exports = {
  get,
  post,
};
