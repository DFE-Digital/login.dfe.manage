'use strict';

const niceware = require('niceware');
const { getServiceById, updateService } = require('../../infrastructure/applications');
const logger = require('../../infrastructure/logger');
const { getUserServiceRoles } = require('./utils');

const buildCurrentServiceModel = async (req) => {
  const service = await getServiceById(req.params.sid, req.id);
  return {
    name: service.name || '',
    description: service.description || '',
    serviceHome: service.relyingParty.service_home || '',
    postResetUrl: service.relyingParty.postResetUrl || '',
    clientId: service.relyingParty.client_id || '',
    clientSecret: service.relyingParty.client_secret || '',
    redirectUris: service.relyingParty.redirect_uris || [],
    postLogoutRedirectUris: service.relyingParty.post_logout_redirect_uris || [],
    responseTypes: service.relyingParty.response_types || [],
    grantTypes: service.relyingParty.grant_types || [],
    apiSecret: service.relyingParty.api_secret || '',
    tokenEndpointAuthMethod: service.relyingParty.token_endpoint_auth_method,
  };
};

const getServiceConfig = async (req, res) => {
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render('services/views/serviceConfig', {
    csrfToken: req.csrfToken(),
    service: await buildCurrentServiceModel(req),
    backLink: `/services/${req.params.sid}`,
    validationMessages: {},
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentNavigation: 'configuration',
  });
};

const validate = async (req, currentService) => {
  const urlValidation = /^https?:\/\/(.*)/;
  const manageRolesForService = await getUserServiceRoles(req);

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
      description: currentService.description || '', // field disabled in form so we don't pick it up from it but use current value
      clientId: req.body.clientId,
      clientSecret: req.body.clientSecret || '',
      serviceHome: req.body.serviceHome || '',
      postResetUrl: req.body.postResetUrl || '',
      redirectUris: selectedRedirects,
      postLogoutRedirectUris: selectedLogout,
      grantTypes,
      responseTypes,
      apiSecret: req.body.apiSecret,
      tokenEndpointAuthMethod: req.body.tokenEndpointAuthMethod === 'client_secret_post' ? 'client_secret_post' : null,
    },
    backLink: `/services/${req.params.sid}`,
    validationMessages: {},
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentNavigation: 'configuration',
  };

  if (!model.service.name) {
    model.validationMessages.name = 'Service name must be present';
  }

  if (model.service.serviceHome && !urlValidation.test(model.service.serviceHome)) {
    model.validationMessages.serviceHome = 'Please enter a valid home Url';
  }

  if (!model.service.clientId) {
    model.validationMessages.clientId = 'Client Id must be present';
  } else if (model.service.clientId.length > 50) {
    model.validationMessages.clientId = 'Client Id must be 50 characters or less';
  } else if (!/^[A-Za-z0-9-]+$/.test(model.service.clientId)) {
    model.validationMessages.clientId = 'Client Id must only contain letters, numbers, and hyphens';
  } else if (
    model.service.clientId.toLowerCase() !== currentService.clientId.toLowerCase()
    && await getServiceById(model.service.clientId, req.id)
  ) {
    // If getServiceById returns truthy, then that clientId is already in use.
    model.validationMessages.clientId = 'Client Id is unavailable, try another';
  }

  if (!urlValidation.test(model.service.postResetUrl) && model.service.postResetUrl.trim() !== '') {
    model.validationMessages.postResetUrl = 'Please enter a valid Post-reset Url';
  }

  if (!model.service.redirectUris || !model.service.redirectUris.length > 0) {
    model.validationMessages.redirect_uris = 'At least one redirect Url must be specified';
  } else if (model.service.redirectUris.some((x) => !urlValidation.test(x))) {
    model.validationMessages.redirect_uris = 'Invalid redirect Url';
  } else if (model.service.redirectUris.some((value, i) => model.service.redirectUris.indexOf(value) !== i)) {
    model.validationMessages.redirect_uris = 'Redirect Urls must be unique';
  }

  if (!model.service.postLogoutRedirectUris || !model.service.postLogoutRedirectUris.length > 0) {
    model.validationMessages.post_logout_redirect_uris = 'At least one logout redirect Url must be specified';
  } else if (model.service.postLogoutRedirectUris.some((x) => !urlValidation.test(x))) {
    model.validationMessages.post_logout_redirect_uris = 'Invalid logout redirect Url';
  } else if (model.service.postLogoutRedirectUris.some((value, i) => model.service.postLogoutRedirectUris.indexOf(value) !== i)) {
    model.validationMessages.post_logout_redirect_uris = 'Logout redirect Urls must be unique';
  }
  if (model.service.clientSecret !== currentService.clientSecret) {
    try {
      const validateClientSecret = niceware.passphraseToBytes(model.service.clientSecret.split('-'));
      if (validateClientSecret.length < 8) {
        model.validationMessages.clientSecret = 'Invalid client secret';
      }
    } catch (e) {
      model.validationMessages.clientSecret = 'Invalid client secret';
    }
  }

  if (model.service.apiSecret && model.service.apiSecret !== currentService.apiSecret) {
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
  const currentService = await buildCurrentServiceModel(req);
  const model = await validate(req, currentService);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render('services/views/serviceConfig', model);
  }

  const editedFields = Object.entries(currentService).filter(([field, oldValue]) => {
    const newValue = model.service[field];
    return Array.isArray(oldValue) ? !(
      Array.isArray(newValue)
      && oldValue.length === newValue.length
      && oldValue.every((value, index) => value === newValue[index])
    ) : oldValue !== newValue;
  }).map(([field, oldValue]) => {
    const isSecret = field.toLowerCase().includes('secret');
    return {
      name: field,
      oldValue: isSecret ? 'EXPUNGED' : oldValue,
      newValue: isSecret ? 'EXPUNGED' : model.service[field],
    };
  });

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
    editedFields,
  });

  await updateService(req.params.sid, updatedService, req.id);

  res.flash('info', 'Service configuration updated successfully');
  return res.redirect('service-configuration');
};

module.exports = {
  getServiceConfig,
  postServiceConfig,
};
