'use strict';
const { getServiceById, updateService } = require('./../../infrastructure/applications');

const getServiceConfig = async (req, res) => {
  const service = await getServiceById(req.params.sid, req.id);
  const grantTypes = service.relyingParty.grant_types ? service.relyingParty.grant_types.join() : '';
  const responseTypes = service.relyingParty.response_types ? service.relyingParty.response_types.join() : '';
  return res.render('services/views/serviceConfig', {
    csrfToken: req.csrfToken(),
    service,
    grantTypes,
    responseTypes,
    backLink: './',
    validationMessages: {},
  });
};

const validate = async (req) => {
  const service = await getServiceById(req.params.sid, req.id);
  const grantTypes = service.relyingParty.grant_types ? service.relyingParty.grant_types.join() : '';
  const responseTypes = service.relyingParty.response_types ? service.relyingParty.response_types.join() : '';
  const model = {
    service,
    grantTypes,
    responseTypes,
    backLink: './',
    validationMessages: {},
  };

  if(!req.body.name) {
    model.validationMessages.name = 'Service name must be present'
  }

  if(!req.body.serviceHome) {
    model.validationMessages.serviceHome = 'Home url must be present'
    //TODO: validate http and https using regex
  } else if (!req.body.serviceHome.startsWith('https') || !req.body.serviceHome.startsWith('http')) {
    model.validationMessages.serviceHome = 'Please enter a valid url'
  }

  if(!req.body.clientId) {
    model.validationMessages.clientId = 'Client Id must be present'
  }

  //TODO: validate redirect and logout urls- must have at least one and be unique- compare strings
  return model;
};

const postServiceConfig = async (req, res) => {
  const model = await validate(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render('services/views/serviceConfig', model);
  }

  let selectedRedirects = req.body.redirect_uris ? req.body.redirect_uris : [];
  if(!(selectedRedirects instanceof Array)) {
    selectedRedirects = [req.body.redirect_uris]
  }
  let selectedLogout = req.body.post_logout_redirect_uris ? req.body.post_logout_redirect_uris : [];
  if (!(selectedLogout instanceof Array)) {
    selectedLogout = [req.body.post_logout_redirect_uris]
  }

  let grantTypes = req.body.grant_types ? req.body.grant_types : [];
  if(!(grantTypes instanceof Array)) {
    grantTypes = [req.body.grant_types]
  }

  let responseTypes = req.body.response_types.split(",").map(x=>x.trim());

  const updatedService = {
    name: req.body.name,
    description: req.body.description,
    clientId: req.body.clientId,
    serviceHome: req.body.serviceHome,
    postResetUrl: req.body.postResetUrl,
    redirect_uris: selectedRedirects,
    post_logout_redirect_uris: selectedLogout,
    grant_types: grantTypes,
    response_types: responseTypes
  };
  await updateService(req.params.sid, updatedService, req.id);

  res.flash('info', 'Service configuration updated successfully');
  return res.redirect(`service-configuration`)
};

module.exports = {
  getServiceConfig,
  postServiceConfig
};
