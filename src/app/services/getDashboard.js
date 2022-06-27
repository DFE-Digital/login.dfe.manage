'use strict';
const { getServiceById } = require('./../../infrastructure/applications');
const getDashboard = async (req, res) => {

  const serviceDetails = await getServiceById(req.params.sid, req.id);
  const allUserRoles = req.userServices.roles.map((role) => ({
    serviceId: role.code.substr(0, role.code.indexOf('_')),
    role: role.code.substr(role.code.lastIndexOf('_') + 1),
  }));
  const userRolesForService = allUserRoles.filter(x => x.serviceId === req.params.sid);
  const manageRolesForService = userRolesForService.map(x => x.role);

  return res.render('services/views/dashboard.ejs', {
    csrfToken: req.csrfToken(),
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    serviceDetails,
    currentPage: '',
  });
};

module.exports = {
  getDashboard,
};
