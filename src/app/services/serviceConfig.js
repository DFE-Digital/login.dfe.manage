'use strict';

const niceware = require('niceware');
const { getServiceById } = require('../../infrastructure/applications');
const { getUserServiceRoles } = require('./utils');

const buildCurrentServiceModel = async (req) => {
  const sessionService = req.query.action === 'amendChanges' ? req.session.serviceConfigurationChanges : {};
  const service = await getServiceById(req.params.sid, req.id);

  let tokenEndpointAuthMethod = null;
  if (sessionService?.token_endpoint_auth_method?.newValue === 'client_secret_post'
      || service.relyingParty.token_endpoint_auth_method === 'client_secret_post') {
    tokenEndpointAuthMethod = 'client_secret_post';
  }

  return {
    name: service.name || '',
    description: service.description || '',
    clientId: service.relyingParty.client_id || '',
    clientSecret: (sessionService?.clientSecret?.secretNewValue || service.relyingParty.client_secret) || '',
    serviceHome: (sessionService?.serviceHome?.newValue || service.relyingParty.service_home) || '',
    postResetUrl: (sessionService?.postResetUrl?.newValue || service.relyingParty.postResetUrl) || '',
    redirectUris: (sessionService?.redirectUris?.newValue || service.relyingParty.redirect_uris) || [],
    postLogoutRedirectUris: (sessionService?.postLogoutRedirectUris?.newValue || service.relyingParty.post_logout_redirect_uris) || [],
    grantTypes: (sessionService?.grantTypes?.newValue || service.relyingParty.grant_types) || [],
    responseTypes: (sessionService?.responseTypes?.newValue || service.relyingParty.response_types) || [],
    apiSecret: (sessionService?.apiSecret?.secretNewValue || service.relyingParty.api_secret) || '',
    tokenEndpointAuthMethod,
  };
};

const getServiceConfig = async (req, res) => {
  if (req.session.serviceConfigurationChanges && req.query.action !== 'amendChanges') {
    req.session.serviceConfigurationChanges = {};
  }
  const manageRolesForService = await getUserServiceRoles(req);
  const currentServiceModel = await buildCurrentServiceModel(req);

  return res.render('services/views/serviceConfig', {
    csrfToken: req.csrfToken(),
    service: currentServiceModel,
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
  // TODO: revert when adding grantTypes NSA-7334
  let grantTypes = req.body.grant_types ? req.body.grant_types : currentService.grantTypes;
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

  // TODO: remove || currentService.clientSecret, currentService.grantTypes for validation NSA-7334
  const model = {
    service: {
      name: currentService.name,
      description: currentService.description,
      clientId: currentService.clientId,
      clientSecret: req.body.clientSecret || currentService.clientSecret,
      serviceHome: req.body.serviceHome || '',
      postResetUrl: req.body.postResetUrl || '',
      redirectUris: selectedRedirects,
      postLogoutRedirectUris: selectedLogout,
      grantTypes: grantTypes || [],
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

  // if (!model.service.name) {
  //   model.validationMessages.name = 'Service name must be present';
  // }

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
  const oldService = await getServiceById(req.params.sid, req.id);
  const oldServiceModel = {
    name: oldService.name || '',
    description: oldService.description || '',
    clientId: oldService.relyingParty.client_id || '',
    clientSecret: oldService.relyingParty.client_secret || '',
    serviceHome: oldService.relyingParty.service_home || '',
    postResetUrl: oldService.relyingParty.postResetUrl || '',
    redirectUris: oldService.relyingParty.redirect_uris || [],
    postLogoutRedirectUris: oldService.relyingParty.post_logout_redirect_uris || [],
    grantTypes: oldService.relyingParty.grant_types || [],
    responseTypes: oldService.relyingParty.response_types || [],
    apiSecret: oldService.relyingParty.api_secret || '',
  };

  const editedFields = Object.entries(oldServiceModel)
    .filter(([field, oldValue]) => {
      const newValue = Array.isArray(model.service[field]) ? model.service[field].sort() : model.service[field];
      return Array.isArray(oldValue) ? !(
        Array.isArray(newValue)
    && oldValue.length === newValue.length
    && oldValue.sort().every((value, index) => value === newValue[index])
      ) : oldValue !== newValue;
    })
    .map(([field, oldValue]) => {
      const isSecret = field.toLowerCase().includes('secret');
      const editedField = {
        name: field,
        oldValue: isSecret ? 'EXPUNGED' : oldValue,
        newValue: isSecret ? 'EXPUNGED' : model.service[field],
        isSecret,
      };
      if (isSecret) {
        editedField.secretNewValue = model.service[field];
      }
      return editedField;
    });

  if (!req.session.serviceConfigurationChanges) {
    req.session.serviceConfigurationChanges = {};
  }

  editedFields.forEach(({
    name, oldValue, newValue, isSecret, secretNewValue,
  }) => {
    if (!req.session.serviceConfigurationChanges[name]) {
      req.session.serviceConfigurationChanges[name] = {};
    }
    req.session.serviceConfigurationChanges[name].oldValue = oldValue;
    req.session.serviceConfigurationChanges[name].newValue = newValue;
    if (isSecret) {
      req.session.serviceConfigurationChanges[name].secretNewValue = secretNewValue;
    }
  });

  return res.redirect('review-service-configuration#');
};

module.exports = {
  getServiceConfig,
  postServiceConfig,
};
