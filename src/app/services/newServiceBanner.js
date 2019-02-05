'use strict';
const { getBannerById, upsertBanner } = require('./../../infrastructure/applications');
const moment = require('moment');

const get = async (req, res) => {
  const model = {
    csrfToken: req.csrfToken(),
    backLink: true,
    name: '',
    bannerTitle: '',
    message: '',
    bannerDisplay: '',
    fromDay: '',
    fromMonth: '',
    fromYear: '',
    fromHour: '',
    fromMinute: '',
    toDay: '',
    toMonth: '',
    toYear: '',
    toHour: '',
    toMinute: '',
    isActive: '',
    validationMessages: {},
  };

  if (req.params.bid) {
    const existingBanner = await getBannerById(req.params.sid, req.params.bid, req.id);
    if (existingBanner) {
      model.name = existingBanner.name;
      model.bannerTitle = existingBanner.title;
      model.message = existingBanner.message;
      //remove these add day, month, year, hour, minute
      model.validFrom = existingBanner.validFrom;
      model.validTo = existingBanner.validTo;
      model.isActive = existingBanner.isActive;
    }
  }
  return res.render('services/views/newServiceBanner', model);
};

const validate = (req) => {
  let fromDate;
  let toDate;
  if (req.body.bannerDisplay === 'date' && req.body.fromYear && req.body.fromMonth && req.body.fromDay && req.body.fromHour && req.body.fromMinute) {
    fromDate = `${req.body.fromYear}-${req.body.fromMonth}-${req.body.fromDay} ${req.body.fromHour}:${req.body.fromMinute}`
  }
  if (req.body.bannerDisplay === 'date' && req.body.toYear && req.body.toMonth && req.body.toDay && req.body.toHour && req.body.toMinute) {
    toDate = `${req.body.toYear}-${req.body.toMonth}-${req.body.toDay} ${req.body.toHour}:${req.body.toMinute}`
  }
  const model = {
    name: req.body.bannerName || '',
    bannerTitle: req.body.bannerTitle || '',
    message: req.body.bannerMesssage || '',
    bannerDisplay: req.body.bannerDisplay || '',
    fromDay: req.body.fromDay,
    fromMonth: req.body.fromMonth,
    fromYear: req.body.fromYear,
    fromHour: req.body.fromHour,
    fromMinute: req.body.fromMinute,
    toDay: req.body.toDay,
    toMonth: req.body.toMonth,
    toYear: req.body.toYear,
    toHour: req.body.toHour,
    toMinute: req.body.toMinute,
    fromDate,
    toDate,
    isActive: false,
    validationMessages: {},
    backLink: true,
  };

  if(!model.name) {
    model.validationMessages.name = 'Please enter a banner name';
  }
  if(!model.bannerTitle) {
    model.validationMessages.title = 'Please enter a banner title';
  }
  if(!model.message) {
    model.validationMessages.message = 'Please enter a banner message';
  }
  if (model.bannerDisplay === 'date' && !model.fromDate) {
    model.validationMessages.fromDate = 'Please enter a from date'
  }
  if (model.bannerDisplay === 'date' && !model.toDate) {
    model.validationMessages.fromDate = 'Please enter a to date'
  }
  if (model.fromDate && !moment(new Date(model.fromDate)).isValid()) {
    model.validationMessages.fromDate = 'From date must be a valid date. For example, 31 01 2019 14:30'
  }
  if (model.toDate && !moment( new Date (model.toDate)).isValid()) {
    model.validationMessages.toDate = 'To date must be a valid date. For example, 31 01 2019 14:30'
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
  if (model.bannerDisplay === 'date') {
  }
  const body = {
    id: req.params.bid ? req.params.bid : undefined,
    name: model.name,
    title: model.bannerTitle,
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
