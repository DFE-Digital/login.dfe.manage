const {
  getServiceRaw,
  getServicePoliciesRaw,
} = require("login.dfe.api-client/services");
const { getUserServiceRoles } = require("./utils");

const viewModel = async (req) => {
  try {
    // Support both parameter names for compatibility
    const serviceId = req.params.serviceId || req.params.sid;
    
    const serviceDetails = await getServiceRaw({
      by: { serviceId },
    });

    const servicePolicies = await getServicePoliciesRaw({
      serviceId,
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
    const manageRolesForService = await getUserServiceRoles(req);

    return {
      csrfToken: req.csrfToken(),
      backLink: true,
      roles,
      serviceDetails,
      serviceId, // ← IMPORTANT: Return serviceId for layout template
      userRoles: manageRolesForService,
      currentNavigation: "roles",
    };
  } catch (error) {
    console.error("ERROR in listRoles viewModel:", error.message);
    throw error;
  }
};

const getListRoles = async (req, res) => {
  try {
    const model = await viewModel(req);
    return res.render("services/views/listRoles", model);
  } catch (error) {
    console.error("ERROR in getListRoles:", error);
    return res.status(500).render("error", { 
      message: error.message,
      error: error 
    });
  }
};

module.exports = getListRoles;
