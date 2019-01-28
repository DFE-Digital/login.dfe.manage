'use strict';
const { getServiceById, updateService } = require('./../../infrastructure/applications');
const niceware = require('niceware');

const getServiceConfig = async (req, res) => {
  const service = await getServiceById(req.params.sid, req.id);
  const grantTypes = service.relyingParty.grant_types ? service.relyingParty.grant_types.join() : '';
  const responseTypes = service.relyingParty.response_types ? service.relyingParty.response_types.join() : '';
  return res.render('services/views/serviceConfig', {
    csrfToken: req.csrfToken(),
    service,
    responseTypes,
    grantTypes,
    backLink: './',
    validationMessages: {},
  });
};

const validate = async (req) => {
  const urlValidation = new RegExp('https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_\\+.~#?&\\\\=]*)');

  const service = await getServiceById(req.params.sid, req.id);
  const grantTypes = service.relyingParty.grant_types ? service.relyingParty.grant_types.join() : '';
  const responseTypes = service.relyingParty.response_types ? service.relyingParty.response_types.join() : '';

  let selectedRedirects = req.body.redirect_uris ? req.body.redirect_uris : [];
  if(!(selectedRedirects instanceof Array)) {
    selectedRedirects = [req.body.redirect_uris];
  }
  selectedRedirects = selectedRedirects.filter(x => x.trim() !== '');

  let selectedLogout = req.body.post_logout_redirect_uris ? req.body.post_logout_redirect_uris : [];
  if (!(selectedLogout instanceof Array)) {
    selectedLogout = [req.body.post_logout_redirect_uris]
  }
  selectedLogout = selectedLogout.filter(x => x.trim() !== '');

  const model = {
    service,
    responseTypes,
    grantTypes,
    selectedRedirects,
    selectedLogout,
    backLink: './',
    validationMessages: {},
  };

  if(!req.body.name) {
    model.validationMessages.name = 'Service name must be present'
  }

  if(!req.body.serviceHome) {
    model.validationMessages.serviceHome = 'Home url must be present'
  } else if (!urlValidation.test(req.body.serviceHome)) {
    model.validationMessages.serviceHome = 'Please enter a valid home url'
  }

  if(!req.body.clientId) {
    model.validationMessages.clientId = 'Client Id must be present'
  }

  if(!urlValidation.test(req.body.postResetUrl) && req.body.postResetUrl.trim() !== '') {
    model.validationMessages.postResetUrl = 'Please enter a valid Post-reset url'
  }

  if(!selectedRedirects || !selectedRedirects.length > 0) {
    model.validationMessages.redirect_uris = 'At least one redirect url must be specified'
  } else if (selectedRedirects.some(x => !urlValidation.test(x))) {
    model.validationMessages.redirect_uris = 'Invalid redirect url'
  } else if (selectedRedirects.some((value, i) => selectedRedirects.indexOf(value) !== i)) {
    model.validationMessages.redirect_uris = 'Redirect urls must be unique'
  }

  if(!selectedLogout || !selectedLogout.length > 0) {
    model.validationMessages.post_logout_redirect_uris = 'At least one logout redirect url must be specified'
  } else if (selectedLogout.some(x => !urlValidation.test(x))) {
    model.validationMessages.post_logout_redirect_uris = 'Invalid logout redirect url'
  } else if (selectedLogout.some((value, i) => selectedLogout.indexOf(value) !== i)) {
    model.validationMessages.post_logout_redirect_uris = 'Logout redirect urls must be unique'
  }
  try {
    const validateClientSecret = niceware.passphraseToBytes(req.body.clientSecret.split('-'));
    if(validateClientSecret.length !== 8) {
      model.validationMessages.clientSecret = 'Invalid client secret';
    }
  } catch (e) {
    model.validationMessages.clientSecret = 'Invalid client secret';
  }

  if (req.body.apiSecret) {
    try {
      const validateApiSecret = niceware.passphraseToBytes(req.body.apiSecret.split('-'));
      if (validateApiSecret.length !== 8) {
        model.validationMessages.apiSecret = 'Invalid api secret';
      }
    } catch (e) {
      model.validationMessages.apiSecret = 'Invalid api secret';
    }
  }
  return model;
};

const postServiceConfig = async (req, res) => {
  const model = await validate(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render('services/views/serviceConfig', model);
  }

  let grantTypes = req.body.grant_types ? req.body.grant_types : [];
  if(!(grantTypes instanceof Array)) {
    grantTypes = [req.body.grant_types]
  }

  let responseTypes = req.body.response_types ? req.body.response_types : [];
  if(!(responseTypes instanceof Array)) {
    responseTypes = [req.body.response_types]
  }

  const updatedService = {
    name: req.body.name,
    description: req.body.description.trim(),
    clientId: req.body.clientId,
    clientSecret: req.body.clientSecret,
    serviceHome: req.body.serviceHome,
    postResetUrl: req.body.postResetUrl,
    redirect_uris: model.selectedRedirects,
    post_logout_redirect_uris: model.selectedLogout,
    grant_types: grantTypes,
    response_types: responseTypes,
    apiSecret: req.body.apiSecret,
    tokenEndpointAuthMethod: req.body.tokenEndpointAuthMethod,
  };
  await updateService(req.params.sid, updatedService, req.id);

  res.flash('info', 'Service configuration updated successfully');
  return res.redirect(`service-configuration`);
};

module.exports = {
  getServiceConfig,
  postServiceConfig
};
