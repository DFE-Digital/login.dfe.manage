const PolicyEngine = require("login.dfe.policy-engine");
const config = require("../../infrastructure/config");
const { getSingleUserService, getSingleInvitationService } = require("../../infrastructure/access");
const { getServiceById } = require("../../infrastructure/applications");
const {
  getUserDetails, getUserServiceRoles, getReturnUrl, getReturnOrgId
} = require("./utils");
const { getOrganisationByIdV2 } = require("../../infrastructure/organisations");

const policyEngine = new PolicyEngine(config);

const getSingleServiceForUser = async (userId, organisationId, serviceId, correlationId) => {
  const userService = userId.startsWith("inv-") ? await getSingleInvitationService(userId.substr(4), serviceId, organisationId, correlationId) : await getSingleUserService(userId, serviceId, organisationId, correlationId);
  const application = await getServiceById(userService.serviceId);
  return {
    id: userService.serviceId,
    roles: userService.roles,
    name: application.name,
  };
};

const getViewModel = async (req) => {
  const user = await getUserDetails(req);
  const organisation = await getOrganisationByIdV2(req.params.oid, req.id);
  const userService = await getSingleServiceForUser(req.params.uid, req.params.oid, req.params.sid, req.id);
  const policyResult = await policyEngine.getPolicyApplicationResultsForUser(req.params.uid.startsWith("inv-") ? undefined : req.params.uid, req.params.oid, req.params.sid, req.id);
  const serviceRoles = policyResult.rolesAvailableToUser;
  const manageRolesForService = await getUserServiceRoles(req);

  return {
    csrfToken: req.csrfToken(),
    service: {
      name: userService.name,
      id: userService.id,
    },
    serviceRoles,
    selectedRoles: [],
    user,
    backLink: getReturnUrl(req.query, `/services/${req.params.sid}/users/${req.params.uid}/organisations`),
    returnOrgId: getReturnOrgId(req.query),
    organisation,
    userService,
    validationMessages: {},
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentNavigation: "users",
  };
};

const get = async (req, res) => {
  const model = await getViewModel(req);
  if (req.session.service) {
    model.selectedRoles = req.session.service.roles;
  }

  model.service.roles = model.userService.roles;
  return res.render("services/views/editService", model);
};

const post = async (req, res) => {
  let selectedRoles = req.body.role ? req.body.role : [];
  if (!(selectedRoles instanceof Array)) {
    selectedRoles = [req.body.role];
  }

  const uid = req.params.uid && !req.params.uid.startsWith("inv-") ? req.params.uid : undefined;
  const policyValidationResult = await policyEngine.validate(uid, req.params.oid, req.params.sid, selectedRoles, req.id);
  if (policyValidationResult.length > 0) {
    const model = await getViewModel(req);
    const roles = {};
    model.service.roles = selectedRoles.map((x) => {
      roles[x] = { id: x };
      return roles;
    });
    model.validationMessages.roles = policyValidationResult.map((x) => x.message);
    return res.render("services/views/editService", model);
  }

  req.session.service = {
    roles: selectedRoles,
  };

  return res.redirect(getReturnUrl(req.query, `${req.params.oid}/confirm-edit-service`));
};

module.exports = {
  get,
  post,
};
