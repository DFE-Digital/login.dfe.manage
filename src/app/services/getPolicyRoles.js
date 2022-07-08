const { getPolicyById } = require('../../infrastructure/access');
const { getServiceById } = require('../../infrastructure/applications');
const { getUserServiceRoles } = require('./utils');

const getPolicyRoles = async (req, res) => {
  const service = await getServiceById(req.params.sid, req.id);
  const policy = await getPolicyById(req.params.sid, req.params.pid, req.id);
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render('services/views/policyRoles', {
    csrfToken: req.csrfToken(),
    policy,
    service,
    backLink: `/services/${req.params.sid}/policies`,
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentNavigation: 'policies',
  });
};

module.exports = getPolicyRoles;
