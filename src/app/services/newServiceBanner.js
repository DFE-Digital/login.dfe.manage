'use strict';
const { getBannerById, upsertBanner } = require('./../../infrastructure/applications');

const get = async (req, res) => {
  const model = {
    csrfToken: req.csrfToken(),
    backLink: true,
    name: '',
    title: '',
    message: '',
    validFrom: '',
    validTo: '',
    isActive: '',
    validationMessages: {},
  };

  if (req.params.bid) {
    const existingBanner = await getBannerById(req.params.sid, req.params.bid, req.id);
    if (existingBanner) {
      model.name = existingBanner.name;
      model.title = existingBanner.title;
      model.message = existingBanner.message;
      model.validFrom = existingBanner.validFrom;
      model.validTo = existingBanner.validTo;
      model.isActive = existingBanner.isActive;
    }
  }
  return res.render('services/views/newServiceBanner', model);
};

const validate = (req) => {
  const model = {
    name: req.body.bannerName || '',
    title: req.body.bannerTitle || '',
    message: req.body.bannerMesssage || '',
    bannerDisplay: req.body.bannerDisplay || '',
    isActive: false,
    validationMessages: {},
    backLink: true,
  };

  if(!model.name) {
    model.validationMessages.name = 'Please enter a banner name';
  }
  if(!model.title) {
    model.validationMessages.title = 'Please enter a banner title';
  }
  if(!model.message) {
    model.validationMessages.message = 'Please enter a banner message';
  }
  return model;
};

const post = async (req, res) => {
  const model = await validate(req);

  if(Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render('services/views/newServiceBanner', model);
  }

  // always show banner
  if (model.bannerDisplay === 'isActive') {
    model.isActive = true;
  }
  // show banner between specific times

  const body = {
    id: req.params.bid ? req.params.bid : undefined,
    name: model.name,
    title: model.title,
    message: model.message,
    validFrom: model.validFrom,
    validTo: model.validTo,
    isActive: model.isActive,
  };

  //TODO: audit event for updated/created banner
  await upsertBanner(req.params.sid, body, req.id);

  res.flash('info', 'Service banner created successfully');
  return res.redirect(`/services/${req.params.sid}/service-banners`);
};

module.exports = {
  get,
  post,
};
