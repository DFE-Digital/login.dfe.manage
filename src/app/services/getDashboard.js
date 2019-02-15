'use strict';

const getDashboard = async (req, res) => {

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
  });
};

module.exports = {
  getDashboard,
};
