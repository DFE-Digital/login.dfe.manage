const {
  getServiceRaw,
  getServicePoliciesRaw,
} = require("login.dfe.api-client/services");

const viewModel = async (req) => {
  const serviceDetails = await getServiceRaw({
    by: { serviceId: req.params.sid },
  });

  // const serviceRoles = await getServiceRolesRaw({serviceId:req.params.sid});
  // console.log("serviceRoles: ", serviceRoles);

  const servicePolicies = await getServicePoliciesRaw({
    serviceId: req.params.sid,
  });
  // console.log("servicePolicies: ", servicePolicies);

  const roleObj = {};

  for (const policy of servicePolicies) {
    for (const role of policy.roles) {
      if (roleObj[role.id]) {
        roleObj[role.id].policies.push(policy.name);
      } else {
        roleObj[role.id] = { ...role, policies: [policy.name] };
      }
    }
  }

  const roles = Object.values(roleObj);

  return {
    csrfToken: req.csrfToken(),
    backLink: true,
    roles,
    serviceDetails,
  };
};

const clearSessionData = (req) => {
  if (req.session.createNewPolicy) {
    req.session.createNewPolicy = undefined;
  }
};

const getListRoles = async (req, res) => {
  clearSessionData(req);
  const model = await viewModel(req);
  return res.render("services/views/listRoles", model);
};

module.exports = getListRoles;
