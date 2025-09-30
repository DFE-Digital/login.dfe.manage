const { getUserServiceRaw } = require("login.dfe.api-client/users");
const config = require("../config");

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    res.locals.isLoggedIn = true;
    return next();
  }
  req.session.redirectUrl = req.originalUrl;
  return res.status(302).redirect("/auth");
};

const isManageUser = (req, res, next) => {
  if (req.userServices && req.userServices.roles.length > 0) {
    return next();
  }
  return res.status(401).render("errors/views/notAuthorised");
};

const isManageUserForService = (req, res, next) => {
  if (req.userServices && req.userServices.roles.length > 0) {
    const services = [];
    for (let i = 0; i < req.userServices.roles.length; i++) {
      const role = req.userServices.roles[i];
      services.push({ id: role.code.substr(0, role.code.indexOf("_")) });
    }
    if (
      services.find((x) => x.id.toLowerCase() === req.params.sid.toLowerCase())
    ) {
      return next();
    }
  }
  return res.status(401).render("errors/views/notAuthorised");
};

const hasRole = (role) => (req, res, next) => {
  if (req.userServices && req.userServices.roles.length > 0) {
    const allUserRoles = req.userServices.roles.map((role) => ({
      serviceId: role.code.substr(0, role.code.indexOf("_")),
      role: role.code.substr(role.code.lastIndexOf("_") + 1),
    }));
    const userRolesForService = allUserRoles.filter(
      (x) => x.serviceId === req.params.sid,
    );
    if (userRolesForService.find((x) => x.role === role)) {
      return next();
    }
  }
  return res.status(401).render("errors/views/notAuthorised");
};

/**
 * Checks if user has a non-service specific role (e.g., a role with a code that
 * isn't in the format of `<uuid>_<rolename>`)
 * @param {string} [role] - Code of the role that is being checked
 */
const hasGenericRole = (role) => (req, res, next) => {
  if (
    req.userServices &&
    req.userServices.roles.length > 0 &&
    req.userServices.roles.find((x) => x.code === role)
  ) {
    return next();
  }
  return res.status(401).render("errors/views/notAuthorised");
};

const getUserDisplayName = (user) =>
  `${user.given_name || ""} ${user.family_name || ""}`.trim();

const setUserContext = async (req, res, next) => {
  if (req.user) {
    res.locals.user = req.user;
    res.locals.displayName = getUserDisplayName(req.user);
    req.userServices = await getUserServiceRaw({
      userId: req.user.sub,
      serviceId: config.access.identifiers.service,
      organisationId: config.access.identifiers.organisation,
    });
  }
  next();
};

// Note: Any changes to user statuses here require corresponding
// updates in login.dfe.services (src/infrastructure/utils/index.js)
// as functionality is duplicated. Ensure consistency across both implementations.
const userStatusMap = [
  { id: -2, name: "Deactivated Invitation", tagColor: "orange" },
  { id: -1, name: "Invited", tagColor: "blue" },
  { id: 0, name: "Deactivated", tagColor: "red" },
  { id: 1, name: "Active", tagColor: "green" },
];

const mapUserStatus = (statusId, changedOn = null) => {
  const statusObj = userStatusMap.find((s) => s.id === statusId);
  if (!statusObj) {
    return {
      id: statusId,
      description: "Unknown",
      tagColor: "grey",
      changedOn,
    };
  }
  return {
    id: statusObj.id,
    description: statusObj.name,
    tagColor: statusObj.tagColor,
    changedOn,
  };
};

const lastLoginIntervalsMap = [
  { id: "lastWeek", name: "Last week" },
  { id: "lastMonth", name: "Last month" },
  { id: "last3Months", name: "Last 3 months" },
  { id: "last6Months", name: "Last 6 months" },
  { id: "onePlusYear", name: "1+ year" },
  { id: "never", name: "Never" },
];

const mapUserRole = (roleId) => {
  if (roleId === 10000) {
    return { id: 10000, description: "Approver" };
  }
  return { id: 0, description: "End user" };
};

const mapSearchUserToSupportModel = (user) => {
  if (!user) {
    return undefined;
  }
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    organisation: user.primaryOrganisation
      ? {
          name: user.primaryOrganisation,
        }
      : null,
    organisations: user.organisations.map((organisation) => {
      if (!organisation.roleName) {
        return {
          ...organisation,
          roleName: mapUserRole(organisation.roleId).description,
        };
      }
      return organisation;
    }),
    services: user.services,
    lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
    successfulLoginsInPast12Months: user.numberOfSuccessfulLoginsInPast12Months,
    status: mapUserStatus(user.statusId, user.statusLastChangedOn),
    pendingEmail: user.pendingEmail,
  };
};

module.exports = {
  isLoggedIn,
  setUserContext,
  isManageUser,
  isManageUserForService,
  hasRole,
  hasGenericRole,
  mapUserStatus,
  mapUserRole,
  mapSearchUserToSupportModel,
  userStatusMap,
  lastLoginIntervalsMap,
};
