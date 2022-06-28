const { getPolicyById } = require('./../../infrastructure/access');
const { getServiceById } = require('./../../infrastructure/applications');

const getPolicyRoles= async (req, res) => {
  const service = await  getServiceById(req.params.sid, req.id);
  const policy = await getPolicyById(req.params.sid, req.params.pid, req.id);
  const allUserRoles = req.userServices.roles.map((role) => ({
    serviceId: role.code.substr(0, role.code.indexOf('_')),
    role: role.code.substr(role.code.lastIndexOf('_') + 1),
  }));
  const userRolesForService = allUserRoles.filter(x => x.serviceId === req.params.sid);
  const manageRolesForService = userRolesForService.map(x => x.role);

  return res.render('services/views/policyRoles', {
    csrfToken: req.csrfToken(),
    policy,
    service,
    backLink: `/services/${req.params.sid}/policies`,
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentPage: 'policies',
  })
};

module.exports = getPolicyRoles;
