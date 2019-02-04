'use strict';
const { listBannersForService } = require('./../../infrastructure/applications');

const get = async (req, res) => {
  const serviceBanners = await listBannersForService(req.params.sid, req.id);

  return res.render('services/views/serviceBanners', {
    csrfToken: req.csrfToken(),
    backLink: true,
    serviceBanners: serviceBanners.banners,
  });
};

module.exports = {
  get,
};
