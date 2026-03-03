const {
  getServiceRaw,
  getServicePoliciesRaw,
} = require("login.dfe.api-client/services");

const viewModel = async (req) => {
  const serviceDetails = await getServiceRaw({
    by: { serviceId: req.params.sid },
  });

  const servicePolicies = await getServicePoliciesRaw({
    serviceId: req.params.sid,
  });

  // Deduplicate service roles if they occur for more than one policy
  const uniqueRoles = {};

  // Check each policy
  for (const policy of servicePolicies) {
    // Check each role in that policy
    for (const role of policy.roles) {
      // Has the role been added already?
      if (uniqueRoles[role.id]) {
        // If it has, push the current policy
        uniqueRoles[role.id].policies.push(policy.name);
      } else {
        // If hasn't, create new role and add current policy
        uniqueRoles[role.id] = { ...role, policies: [policy.name] };
      }
    }
  }

  const roles = Object.values(uniqueRoles);

  return {
    csrfToken: req.csrfToken(),
    backLink: true,
    roles,
    serviceDetails,
  };
};

const getListRoles = async (req, res) => {
  const model = await viewModel(req);
  return res.render("services/views/listRoles", model);
};

module.exports = getListRoles;
