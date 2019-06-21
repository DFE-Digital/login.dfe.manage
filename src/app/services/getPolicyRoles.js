const { getPolicyById } = require('./../../infrastructure/access');
const { getServiceById } = require('./../../infrastructure/applications');

const getPolicyRoles= async (req, res) => {
  const service = await  getServiceById(req.params.sid, req.id);
  const policy = await getPolicyById(req.params.sid, req.params.pid, req.id);
  return res.render('services/views/policyRoles', {
    csrfToken: req.csrfToken(),
    policy,
    service,
    backLink: `/services/${req.params.sid}/policies`,
  })
};

module.exports = getPolicyRoles;
