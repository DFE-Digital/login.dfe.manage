'use strict';
const { getBannerById, upsertBanner, listAllBannersForService } = require('./../../infrastructure/applications');
const moment = require('moment');

const get = async (req, res) => {
  const model = {
    csrfToken: req.csrfToken(),
    backLink: true,
    cancelLink: `/services/${req.params.sid}/service-banners`,
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
    isEditExisting: false,
    bannerId: req.params.bid,
    validationMessages: {},
  };

  if (req.params.bid) {
    const existingBanner = await getBannerById(req.params.sid, req.params.bid, req.id);
    if (existingBanner) {
      model.isEditExisting = true;
      model.name = existingBanner.name;
      model.bannerTitle = existingBanner.title;
      model.message = existingBanner.message;
      model.isActive = existingBanner.isActive;

      if (existingBanner.isActive) {
        model.bannerDisplay = 'isActive';
      } else if (existingBanner.validFrom && existingBanner.validTo) {
        model.bannerDisplay = 'date';
        // get existing dates if editing
        const validFrom = existingBanner.validFrom;
        const validTo = existingBanner.validTo;
        model.fromYear = validFrom.substr(0,4);
        model.fromMonth = validFrom.substr(5,2);
        model.fromDay = validFrom.substr(8,2);
        model.fromHour = validFrom.substr(11,2);
        model.fromMinute = validFrom.substr(14,2);
        model.toYear = validTo.substr(0,4);
        model.toMonth = validTo.substr(5,2);
        model.toDay = validTo.substr(8,2);
        model.toHour = validTo.substr(11,2);
        model.toMinute = validTo.substr(14,2);
      } else {
        model.bannerDisplay = 'notActive';
      }
    }
  }
  return res.render('services/views/newServiceBanner', model);
};

const validate = async (req) => {
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
    bannerId: req.params.bid,
    validationMessages: {},
    backLink: true,
    cancelLink: `/services/${req.params.sid}/service-banners`,
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
  if(!model.bannerDisplay) {
    model.validationMessages.bannerDisplay = 'Please select when you want the banner to be displayed'
  }
  if (model.bannerDisplay === 'date') {
    let validToDate = true;
    let validFromDate = true;

    if (!model.fromDate) {
      validFromDate = false;
      model.validationMessages.fromDate = 'Please enter a from date'
    } else {
      if (!moment(new Date(model.fromDate)).isValid()) {
        validFromDate = false;
        model.validationMessages.fromDate = 'From date must be a valid date. For example, 31 03 1980 14:30'
      } else {
        const allCurrentServiceBanners = await listAllBannersForService(req.params.sid, req.id);
        const isInRange = allCurrentServiceBanners.find(x => moment(fromDate).isBetween(x.validFrom, x.validTo) === true);
        if (isInRange) {
          //TODO: link to the banner that exists
          validFromDate = false;
          model.validationMessages.fromDate = `Another banner exists between ${moment(isInRange.validFrom).format('DD MM YYYY HH:MM')} and ${moment(isInRange.validTo).format('DD MM YYYY HH:MM')}`
        }
      }
    }
    if (!model.toDate) {
      validToDate = false;
      model.validationMessages.toDate = 'Please enter a to date'
    } else {
      if (!moment( new Date (model.toDate)).isValid()) {
        validToDate = false;
        model.validationMessages.toDate = 'To date must be a valid date. For example, 31 03 1980 14:30'
      } else {
        const allCurrentServiceBanners = await listAllBannersForService(req.params.sid, req.id);
        const isInRange = allCurrentServiceBanners.find(x => moment(toDate).isBetween(x.validFrom, x.validTo) === true);
        if (isInRange) {
          //TODO: link to the banner that exists
          validToDate = false;
          model.validationMessages.toDate = `Another banner exists between ${moment(isInRange.validFrom).format('DD MM YYYY HH:MM')} and ${moment(isInRange.validTo).format('DD MM YYYY HH:MM')}`
        }
      }
    }

    if (validToDate && validFromDate && !(moment(toDate).isAfter(fromDate))) {
      model.validationMessages.toDate = 'To date must be after from date'
    }
  }


  //TODO: validate alwaysOn banners

  return model;
};

const post = async (req, res) => {
  const model = await validate(req);

  if(Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render('services/views/newServiceBanner', model);
  }

  if (model.bannerDisplay === 'isActive') {
    model.isActive = true;
  }

  const body = {
    id: req.params.bid ? req.params.bid : undefined,
    name: model.name,
    title: model.bannerTitle,
    message: model.message,
    validFrom: model.fromDate,
    validTo: model.toDate,
    isActive: model.isActive,
  };

  //TODO: audit event for updated/created banner
  await upsertBanner(req.params.sid, body, req.id);

  req.params.bid ? res.flash('info', 'Service banner updated successfully') : res.flash('info', 'Service banner created successfully');
  return res.redirect(`/services/${req.params.sid}/service-banners`);
};

module.exports = {
  get,
  post,
};
