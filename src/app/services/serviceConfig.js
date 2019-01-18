'use strict';
const { getServiceById } = require('./../../infrastructure/applications');

const getServiceConfig = async (req, res) => {
  const service = await getServiceById(req.params.sid, req.id);
  return res.render('services/views/serviceConfig', {
    csrfToken: req.csrfToken(),
    service
  });
};

module.exports = {
  getServiceConfig,
};
