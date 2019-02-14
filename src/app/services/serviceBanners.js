'use strict';
const { listBannersForService } = require('./../../infrastructure/applications');

const get = async (req, res) => {
  const paramsSource = req.method === 'POST' ? req.body : req.query;
  let page = paramsSource.page ? parseInt(paramsSource.page) : 1;
  if (isNaN(page)) {
    page = 1;
  }
  const serviceBanners = await listBannersForService(req.params.sid,10, page, req.id);

  return res.render('services/views/serviceBanners', {
    csrfToken: req.csrfToken(),
    backLink: `/services/${req.params.sid}`,
    serviceBanners: serviceBanners.banners,
    page: serviceBanners.page,
    totalNumberOfResults: serviceBanners.totalNumberOfRecords,
    numberOfPages: serviceBanners.totalNumberOfPages,
    serviceId: req.params.sid,
  });
};

const post = async (req, res) => {
  const paramsSource = req.method === 'POST' ? req.body : req.query;
  let page = paramsSource.page ? parseInt(paramsSource.page) : 1;
  if (isNaN(page)) {
    page = 1;
  }
  const serviceBanners = await listBannersForService(req.params.sid,10, page, req.id);
  return res.render('services/views/serviceBanners', {
    csrfToken: req.csrfToken(),
    backLink: true,
    serviceBanners: serviceBanners.banners,
    page: serviceBanners.page,
    totalNumberOfResults: serviceBanners.totalNumberOfRecords,
    numberOfPages: serviceBanners.totalNumberOfPages,
    serviceId: req.params.sid,
  });
};

module.exports = {
  get,
  post,
};
