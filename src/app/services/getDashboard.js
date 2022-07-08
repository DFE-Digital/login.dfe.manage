'use strict';

const { getServiceById } = require('../../infrastructure/applications');
const { getUserServiceRoles } = require('./utils');

const getDashboard = async (req, res) => {
  const serviceDetails = await getServiceById(req.params.sid, req.id);
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render('services/views/dashboard.ejs', {
    csrfToken: req.csrfToken(),
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    serviceDetails,
    currentNavigation: 'dashboard',
  });
};

module.exports = {
  getDashboard,
};
