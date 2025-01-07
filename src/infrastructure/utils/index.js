const { getSingleUserService } = require('../access');
const { getServiceById } = require('../applications');
const config = require('../config');

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    res.locals.isLoggedIn = true;
    return next();
  }
  req.session.redirectUrl = req.originalUrl;
  return res.status(302).redirect('/auth');
};

const isManageUser = (req, res, next) => {
  if (req.userServices && req.userServices.roles.length > 0) {
    return next();
  }
  return res.status(401).render('errors/views/notAuthorised');
};

const isManageUserForService = (req, res, next) => {
  if (req.userServices && req.userServices.roles.length > 0) {
    const services = [];
    for (let i = 0; i < req.userServices.roles.length; i++) {
      const role = req.userServices.roles[i];
      services.push({ id: role.code.substr(0, role.code.indexOf('_')) });
    }
    if (services.find((x) => x.id.toLowerCase() === req.params.sid.toLowerCase())) {
      return next();
    }
  }
  return res.status(401).render('errors/views/notAuthorised');
};

const hasRole = (role) => (req, res, next) => {
  if (req.userServices && req.userServices.roles.length > 0) {
    const allUserRoles = req.userServices.roles.map((role) => ({
      serviceId: role.code.substr(0, role.code.indexOf('_')),
      role: role.code.substr(role.code.lastIndexOf('_') + 1),
    }));
    const userRolesForService = allUserRoles.filter((x) => x.serviceId === req.params.sid);
    if (userRolesForService.find((x) => x.role === role)) {
      return next();
    }
  }
  return res.status(401).render('errors/views/notAuthorised');
};

const hasInvite = async (req, res, next) => {
  const service = await getServiceById(req.params.sid, req.id);
  if (service.relyingParty && service.relyingParty.params && service.relyingParty.params.allowManageInvite === 'true') {
    return next();
  }
  return res.status(401).render('errors/views/notFound');
};

const getUserDisplayName = (user) => `${user.given_name || ''} ${user.family_name || ''}`.trim();

const setUserContext = async (req, res, next) => {
  if (req.user) {
    res.locals.user = req.user;
    res.locals.displayName = getUserDisplayName(req.user);
    req.userServices = await getSingleUserService(req.user.sub, config.access.identifiers.service, config.access.identifiers.organisation, req.id);
  }
  next();
};

const userStatusMap = [
  { id: -2, name: 'Deactivated Invitation', tagColor: 'orange' },
  { id: -1, name: 'Invited', tagColor: 'blue' },
  { id: 0, name: 'Deactivated', tagColor: 'red' },
  { id: 1, name: 'Active', tagColor: 'green' },
];

const mapUserStatus = (status, changedOn = null) => {
  const statusObj = userStatusMap.find((s) => s.id === status);
  if (!statusObj) {
    return null;
  }
  return {
    id: statusObj.id,
    description: statusObj.name,
    tagColor: statusObj.tagColor,
    changedOn,
  };
};

const lastLoginIntervalsMap = [
  { id: 'lastWeek', name: 'Last week' },
  { id: 'lastMonth', name: 'Last month' },
  { id: 'last3Months', name: 'Last 3 months' },
  { id: 'last6Months', name: 'Last 6 months' },
  { id: 'onePlusYear', name: '1+ year' },
  { id: 'never', name: 'Never' },
];

const mapUserRole = (roleId) => {
  if (roleId === 10000) {
    return { id: 10000, description: 'Approver' };
  }
  return { id: 0, description: 'End user' };
};

module.exports = {
  isLoggedIn,
  setUserContext,
  isManageUser,
  isManageUserForService,
  hasRole,
  mapUserStatus,
  mapUserRole,
  hasInvite,
  userStatusMap,
  lastLoginIntervalsMap,
};
