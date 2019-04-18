const { getPolicyById } = require('./../../infrastructure/access');
const { getServiceById } = require('./../../infrastructure/applications');

const getPolicyConditions = async (req, res) => {
  const service = await  getServiceById(req.params.sid, req.id);
  const policy = await getPolicyById(req.params.sid, req.params.pid, req.id);
  return res.render('services/views/policyConditions', {
    csrfToken: req.csrfToken(),
    policy,
    service,
    backLink: true,
  })
};

module.exports = getPolicyConditions;
