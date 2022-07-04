'use strict';

const niceware = require('niceware');
const { getServiceById, updateService } = require('../../infrastructure/applications');
const logger = require('../../infrastructure/logger');
const { getUserServiceRoles } = require('../../utils/getUserServiceRoles');

const getServiceConfig = async (req, res) => {
  const service = await getServiceById(req.params.sid, req.id);
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render('services/views/serviceConfig', {
    csrfToken: req.csrfToken(),
    service: {
      name: service.name || '',
      description: service.description || '',
      serviceHome: service.relyingParty.service_home || '',
      postResetUrl: service.relyingParty.postResetUrl || '',
      clientId: service.relyingParty.client_id || '',
      clientSecret: service.relyingParty.client_secret || '',
      redirectUris: service.relyingParty.redirect_uris,
      postLogoutRedirectUris: service.relyingParty.post_logout_redirect_uris,
      responseTypes: service.relyingParty.response_types || [],
      grantTypes: service.relyingParty.grant_types || [],
      apiSecret: service.relyingParty.api_secret || '',
      tokenEndpointAuthMethod: service.relyingParty.token_endpoint_auth_method,
    },
    backLink: `/services/${req.params.sid}`,
    validationMessages: {},
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentPage: 'service-configuration',
  });
};

const validate = async (req) => {
  const service = await getServiceById(req.params.sid, req.id);
  const urlValidation = new RegExp('^https?:\\/\\/(.*)');

  let grantTypes = req.body.grant_types ? req.body.grant_types : [];
  if (!(grantTypes instanceof Array)) {
    grantTypes = [req.body.grant_types];
  }

  let responseTypes = req.body.response_types ? req.body.response_types : [];
  if (!(responseTypes instanceof Array)) {
    responseTypes = [req.body.response_types];
  }

  let selectedRedirects = req.body.redirect_uris ? req.body.redirect_uris : [];
  if (!(selectedRedirects instanceof Array)) {
    selectedRedirects = [req.body.redirect_uris];
  }
  selectedRedirects = selectedRedirects.filter((x) => x.trim() !== '');

  let selectedLogout = req.body.post_logout_redirect_uris ? req.body.post_logout_redirect_uris : [];
  if (!(selectedLogout instanceof Array)) {
    selectedLogout = [req.body.post_logout_redirect_uris];
  }
  selectedLogout = selectedLogout.filter((x) => x.trim() !== '');

  const model = {
    service: {
      name: req.body.name,
      description: service.description || '', // field disabled in form so we don't pick it up from it but use current value
      clientId: req.body.clientId,
      clientSecret: req.body.clientSecret || '',
      serviceHome: req.body.serviceHome || '',
      postResetUrl: req.body.postResetUrl || '',
      redirectUris: selectedRedirects,
      postLogoutRedirectUris: selectedLogout,
      grantTypes,
      responseTypes,
      apiSecret: req.body.apiSecret,
      tokenEndpointAuthMethod: req.body.tokenEndpointAuthMethod,
    },
    backLink: `/services/${req.params.sid}`,
    validationMessages: {},
  };

  if (!model.service.name) {
    model.validationMessages.name = 'Service name must be present';
  }

  if (model.service.serviceHome && !urlValidation.test(model.service.serviceHome)) {
    model.validationMessages.serviceHome = 'Please enter a valid home url';
  }

  if (!model.service.clientId) {
    model.validationMessages.clientId = 'Client Id must be present';
  }

  if (!urlValidation.test(model.service.postResetUrl) && model.service.postResetUrl.trim() !== '') {
    model.validationMessages.postResetUrl = 'Please enter a valid Post-reset url';
  }

  if (!model.service.redirectUris || !model.service.redirectUris.length > 0) {
    model.validationMessages.redirect_uris = 'At least one redirect url must be specified';
  } else if (model.service.redirectUris.some((x) => !urlValidation.test(x))) {
    model.validationMessages.redirect_uris = 'Invalid redirect url';
  } else if (model.service.redirectUris.some((value, i) => model.service.redirectUris.indexOf(value) !== i)) {
    model.validationMessages.redirect_uris = 'Redirect urls must be unique';
  }

  if (!model.service.postLogoutRedirectUris || !model.service.postLogoutRedirectUris.length > 0) {
    model.validationMessages.post_logout_redirect_uris = 'At least one logout redirect url must be specified';
  } else if (model.service.postLogoutRedirectUris.some((x) => !urlValidation.test(x))) {
    model.validationMessages.post_logout_redirect_uris = 'Invalid logout redirect url';
  } else if (model.service.postLogoutRedirectUris.some((value, i) => model.service.postLogoutRedirectUris.indexOf(value) !== i)) {
    model.validationMessages.post_logout_redirect_uris = 'Logout redirect urls must be unique';
  }
  if (model.service.clientSecret !== service.relyingParty.client_secret) {
    try {
      const validateClientSecret = niceware.passphraseToBytes(model.service.clientSecret.split('-'));
      if (validateClientSecret.length < 8) {
        model.validationMessages.clientSecret = 'Invalid client secret';
      }
    } catch (e) {
      model.validationMessages.clientSecret = 'Invalid client secret';
    }
  }

  if (model.service.apiSecret && model.service.apiSecret !== service.relyingParty.api_secret) {
    try {
      const validateApiSecret = niceware.passphraseToBytes(model.service.apiSecret.split('-'));
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

  const updatedService = {
    name: model.service.name,
    description: model.service.description,
    clientId: model.service.clientId,
    clientSecret: model.service.clientSecret,
    serviceHome: model.service.serviceHome,
    postResetUrl: model.service.postResetUrl,
    redirect_uris: model.service.redirectUris,
    post_logout_redirect_uris: model.service.postLogoutRedirectUris,
    grant_types: model.service.grantTypes,
    response_types: model.service.responseTypes,
    apiSecret: model.service.apiSecret,
    tokenEndpointAuthMethod: model.service.tokenEndpointAuthMethod === 'client_secret_post' ? 'client_secret_post' : null,
  };

  logger.audit(`${req.user.email} (id: ${req.user.sub}) updated service configuration for service ${model.service.name} (id: ${req.params.sid})`, {
    type: 'manage',
    subType: 'service-config-updated',
    userId: req.user.sub,
    userEmail: req.user.email,
    editedService: req.params.sid,
  });

  await updateService(req.params.sid, updatedService, req.id);

  res.flash('info', 'Service configuration updated successfully');
  return res.redirect('service-configuration');
};

module.exports = {
  getServiceConfig,
  postServiceConfig,
};
