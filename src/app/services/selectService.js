'use strict';
const { getServiceById } = require('./../../infrastructure/applications');
const uniqBy = require('lodash/uniqBy');
const sortBy = require('lodash/sortBy');

const getServiceDetails = async (req) => {

  let userServices = req.userServices.roles.map((role) => ({
    id: role.code.substr(0, role.code.indexOf('_')),
    name: ''
  }));

  userServices = uniqBy(userServices, 'id');

  for (let i = 0; i < userServices.length; i++) {
    const service = userServices[i];
    const application = await getServiceById(service.id, req.id);
    service.name = application.name;
    service.description = application.description;
  }
  return sortBy(userServices, 'name');
};

const get = async (req, res) => {
  if (!req.userServices || req.userServices.roles.length === 0) {
    return res.status(401).render('errors/views/notAuthorised');
  }
  const userServices = await getServiceDetails(req);
  if (userServices.length === 1) {
    const service = userServices[0];
    return res.redirect(`${service.id}`);
  }
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
