'use strict';
const { getServiceById } = require('./../../infrastructure/applications');

const getServiceDetails = async (req) => {
  const userServices = [];
  for (let i = 0; i < req.userServices.length; i++) {
    const service = req.userServices[i];
    userServices.push(await getServiceById(service.id, req.id));
  }
  return userServices;
};

const get = async (req, res) => {
  const userServices = await getServiceDetails(req);
  return res.render('services/views/selectService', {
    csrfToken: req.csrfToken(),
    title: 'Select service',
    services: userServices,
    validationMessages: {},
  })
};

const validate = async (req) => {
  const userServices = await getServiceDetails(req);
  const selectedService = req.body.selectedService;
  const model = {
    title: 'Select service',
    services: userServices,
    selectedService,
    validationMessages: {},
  };
  if (model.selectedService === undefined || model.selectedService === null) {
    model.validationMessages.selectedService = 'Please select a service'
  }
  return model;
};

const post = async (req, res) => {
  const model = await validate(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render('services/views/selectService', model);
  }
  return res.redirect(`/services/${model.selectedService}`)
};

module.exports = {
  get,
  post,
};
