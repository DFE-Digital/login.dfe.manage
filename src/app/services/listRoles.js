const {
  getServiceRaw,
  getServicePoliciesRaw,
} = require("login.dfe.api-client/services");
const { getUserServiceRoles } = require("./utils");
const logger = require("../../infrastructure/logger");

const getServiceIdFromRequest = (req) =>
  req?.params?.sid || req?.params?.serviceId;

const viewModel = async (req) => {
  const serviceId = getServiceIdFromRequest(req);

  if (!serviceId) {
    throw {
      statusCode: 400,
      message: "Service ID is required",
    };
  }

  logger.info(`[listRoles] Fetching roles for service: ${serviceId}`);

  // Fetch service details
  let serviceDetails;
  try {
    serviceDetails = await getServiceRaw({
      by: { serviceId },
    });
  } catch (apiError) {
    logger.error(`[listRoles] Failed to fetch service details:`, apiError);
    throw {
      statusCode: 503,
      message: "Unable to connect to service API",
    };
  }

  if (!serviceDetails || !serviceDetails.id) {
    logger.warn(`[listRoles] Service not found: ${serviceId}`);
    throw {
      statusCode: 404,
      message: `Service not found`,
    };
  }

  // Fetch service policies
  let servicePolicies = [];
  try {
    const policiesResult = await getServicePoliciesRaw({
      serviceId,
    });
    servicePolicies = Array.isArray(policiesResult)
      ? policiesResult
      : policiesResult?.policies || [];
    logger.info(`[listRoles] Found ${servicePolicies.length} policies`);
  } catch (apiError) {
    logger.warn(`[listRoles] Could not fetch policies:`, apiError);
    // Continue with empty policies rather than failing
    servicePolicies = [];
  }

  // Build unique roles map
  const uniqueRoles = {};

  servicePolicies.forEach((policy) => {
    if (!policy || !Array.isArray(policy.roles)) return;
    const policyName = policy.name || "";

    policy.roles.forEach((role) => {
      if (!role || !role.id) return;

      if (uniqueRoles[role.id]) {
        const policies = uniqueRoles[role.id].policies || [];
        if (policyName && !policies.includes(policyName)) {
          policies.push(policyName);
        }
      } else {
        uniqueRoles[role.id] = {
          ...role,
          policies: policyName ? [policyName] : [],
        };
      }
    });
  });

  const roles = Object.values(uniqueRoles);

  // Get user service roles
  let manageRolesForService = [];
  try {
    const rolesReq = req.params?.sid
      ? req
      : {
          ...req,
          params: {
            ...req.params,
            sid: serviceId,
          },
        };
    manageRolesForService = (await getUserServiceRoles(rolesReq)) || [];
  } catch (error) {
    logger.warn(`[listRoles] Could not fetch user roles:`, error);
  }

  return {
    csrfToken: req.csrfToken(),
    backLink: true,
    roles,
    serviceDetails,
    serviceId,
    userRoles: manageRolesForService,
    currentNavigation: "policies",
  };
};

const getListRoles = async (req, res) => {
  try {
    const model = await viewModel(req);
    res.render("services/views/listRoles", model);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Unable to load service roles";

    logger.error(`[listRoles] Error (${statusCode}): ${message}`);

    res.status(statusCode).render("errors/views/notFound", {
      message,
    });
  }
};

module.exports = getListRoles;
