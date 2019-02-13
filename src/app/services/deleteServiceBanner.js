'use strict';

const { removeBanner, getBannerById } = require('./../../infrastructure/applications');

const get = async (req, res) => {
  const serviceBanners = await getBannerById(req.params.sid, req.params.bid, req.id);
  return res.render('services/views/deleteServiceBanner', {
    csrfToken: req.csrfToken(),
    backLink: `/services/${req.params.sid}/service-banners/${req.params.bid}`,
    cancelLink: `/services/${req.params.sid}/service-banners/${req.params.bid}`,
    serviceId: req.params.sid,
    serviceBanners,
  });
};

const post = async (req, res) => {
  await removeBanner(req.params.sid, req.params.bid, req.id);

  //TODO: audit banner removal

  res.flash('info','Banner successfully deleted');
  res.redirect(`/services/${req.params.sid}/service-banners`);
};

module.exports = {
  get,
  post,
};
