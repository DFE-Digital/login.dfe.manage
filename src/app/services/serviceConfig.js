const niceware = require('niceware');
const {
  AUTHENTICATION_FLOWS,
  GRANT_TYPES,
} = require('../../constants/serviceConfigConstants');
const { getServiceById } = require('../../infrastructure/applications');
const {
  getUserServiceRoles,
  determineAuthFlowByRespType,
  processRedirectUris,
  processConfigurationTypes,
  isValidUrl,
} = require('./utils');

const buildServiceModelFromObject = (service, sessionService = {}) => {
  let tokenEndpointAuthMethod = null;

  const sessionValue = sessionService?.tokenEndpointAuthMethod?.newValue;
  const fallbackValue = service.relyingParty.token_endpoint_auth_method === 'client_secret_post' ? 'client_secret_post' : null;

  const responseTypes = (sessionService?.responseTypes?.newValue || service.relyingParty.response_types) || [];
  const authFlowType = determineAuthFlowByRespType(responseTypes);

  tokenEndpointAuthMethod = (sessionValue !== undefined && authFlowType !== 'implicitFlow') ? sessionValue : fallbackValue;

  let grantTypes = [];
  if (sessionService?.grantTypes?.newValue && authFlowType !== 'implicitFlow') {
    grantTypes = sessionService?.grantTypes?.newValue;
  } else {
    grantTypes = service.relyingParty?.grant_types || [];
  }

  const refreshToken = grantTypes.includes(GRANT_TYPES.REFRESH_TOKEN) ? GRANT_TYPES.REFRESH_TOKEN : null;

  return {
    name: service.name || '',
    description: service.description || '',
    clientId: service.relyingParty.client_id || '',
    clientSecret: (sessionService?.clientSecret?.secretNewValue || service.relyingParty.client_secret) || '',
    serviceHome: (sessionService?.serviceHome?.newValue || service.relyingParty.service_home) || '',
    postResetUrl: (sessionService?.postResetUrl?.newValue || service.relyingParty.postResetUrl) || '',
    redirectUris: (sessionService?.redirectUris?.newValue || service.relyingParty.redirect_uris) || [],
    postLogoutRedirectUris: (sessionService?.postLogoutRedirectUris?.newValue || service.relyingParty.post_logout_redirect_uris) || [],
    grantTypes,
    responseTypes,
    apiSecret: (sessionService?.apiSecret?.secretNewValue || service.relyingParty.api_secret) || '',
    refreshToken,
    tokenEndpointAuthMethod,
  };
};

const buildCurrentServiceModel = async (req) => {
  try {
    const sessionService = req.query?.action === 'amendChanges' ? req.session.serviceConfigurationChanges : {};
    const service = await getServiceById(req.params.sid, req.id);
    const currentServiceModel = buildServiceModelFromObject(service, sessionService);
    const oldServiceConfigModel = buildServiceModelFromObject(service);

    return {
      currentServiceModel,
      oldServiceConfigModel,
    };
  } catch (error) {
    throw new Error(`Could not build service model - ${error}`);
  }
};

const getServiceConfig = async (req, res) => {
  try {
    if (req.session.serviceConfigurationChanges && req.query.action !== 'amendChanges') {
      req.session.serviceConfigurationChanges = {};
    }
    const manageRolesForService = await getUserServiceRoles(req);
    const serviceModel = await buildCurrentServiceModel(req);
    return res.render('services/views/serviceConfig', {
      csrfToken: req.csrfToken(),
      service: serviceModel.currentServiceModel,
      backLink: `/services/${req.params.sid}`,
      validationMessages: {},
      serviceId: req.params.sid,
      userRoles: manageRolesForService,
      currentNavigation: 'configuration',
    });
  } catch (error) {
    throw new Error(error);
  }
};

const validate = async (req, currentService, oldService) => {
  const urlValidation = /^https?:\/\/(.*)/;
  const manageRolesForService = await getUserServiceRoles(req);

  const responseTypes = processConfigurationTypes(req.body.response_types);
  const selectedRedirects = processRedirectUris(req.body.redirect_uris);
  const selectedLogout = processRedirectUris(req.body.post_logout_redirect_uris);

  const authFlowType = determineAuthFlowByRespType(responseTypes);

  const isImplicitFlow = authFlowType === AUTHENTICATION_FLOWS.IMPLICIT_FLOW;
  const isAuthorisationCodeFlow = authFlowType === AUTHENTICATION_FLOWS.AUTHORISATION_CODE_FLOW;
  const isHybridFlow = authFlowType === AUTHENTICATION_FLOWS.HYBRID_FLOW;

  const refreshToken = (req.body.refresh_token && !isImplicitFlow) ? req.body.refresh_token : null;
  let grantTypes = [];

  if (isHybridFlow || isAuthorisationCodeFlow) {
    grantTypes = [GRANT_TYPES.AUTHORIZATION_CODE];
    if (refreshToken) {
      grantTypes.push(refreshToken);
    }
  } else if (isImplicitFlow) {
    grantTypes = [GRANT_TYPES.IMPLICIT];
  }

  const model = {
    service: {
      name: currentService.name,
      description: currentService.description,
      clientId: currentService.clientId,
      clientSecret: !isImplicitFlow ? req.body.clientSecret : oldService.clientSecret,
      serviceHome: (req.body.serviceHome || '').trim(),
      postResetUrl: (req.body.postResetUrl || '').trim(),
      redirectUris: selectedRedirects,
      postLogoutRedirectUris: selectedLogout,
      grantTypes: grantTypes || [],
      responseTypes,
      apiSecret: req.body.apiSecret,
      tokenEndpointAuthMethod: req.body.tokenEndpointAuthMethod === 'client_secret_post' ? 'client_secret_post' : null,
      refreshToken,
    },
    authFlowType,
    backLink: `/services/${req.params.sid}`,
    validationMessages: {},
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentNavigation: 'configuration',
  };

  if (model.service.serviceHome && !isValidUrl(model.service.serviceHome)) {
    model.validationMessages.serviceHome = 'Please enter a valid home Url';
  }

  if (model.service.responseTypes.length === 0) {
    model.validationMessages.respnseTypes = 'Select at least 1 response type';
  } else if (model.service.responseTypes.length === 1 && model.service.responseTypes.includes('token')) {
    model.validationMessages.respnseTypes = 'You must select more than 1 response type when selecting  \'token\' as a response type';
  }

  // if (!model.service.clientId) {
  //   model.validationMessages.clientId = 'Client Id must be present';
  // } else if (model.service.clientId.length > 50) {
  //   model.validationMessages.clientId = 'Client Id must be 50 characters or less';
  // } else if (!/^[A-Za-z0-9-]+$/.test(model.service.clientId)) {
  //   model.validationMessages.clientId = 'Client Id must only contain letters, numbers, and hyphens';
  // } else if (
  //   model.service.clientId.toLowerCase() !== currentService.clientId.toLowerCase()
  //   && await getServiceById(model.service.clientId, req.id)
  // ) {
  //   // If getServiceById returns truthy, then that clientId is already in use.
  //   model.validationMessages.clientId = 'Client Id is unavailable, try another';
  // }

  if (!isValidUrl(model.service.postResetUrl) && model.service.postResetUrl.trim() !== '') {
    model.validationMessages.postResetUrl = 'Please enter a valid Post-reset Url';
  }

  if (!model.service.redirectUris || !model.service.redirectUris.length > 0) {
    model.validationMessages.redirect_uris = 'At least one redirect Url must be specified';
  } else if (model.service.redirectUris.some((x) => !isValidUrl(x))) {
    model.validationMessages.redirect_uris = 'Invalid redirect Url';
  } else if (model.service.redirectUris.some((value, i) => model.service.redirectUris.indexOf(value) !== i)) {
    model.validationMessages.redirect_uris = 'Redirect Urls must be unique';
  }

  if (!model.service.postLogoutRedirectUris || !model.service.postLogoutRedirectUris.length > 0) {
    model.validationMessages.post_logout_redirect_uris = 'At least one logout redirect Url must be specified';
  } else if (model.service.postLogoutRedirectUris.some((x) => !isValidUrl(x))) {
    model.validationMessages.post_logout_redirect_uris = 'Invalid logout redirect Url';
  } else if (model.service.postLogoutRedirectUris.some((value, i) => model.service.postLogoutRedirectUris.indexOf(value) !== i)) {
    model.validationMessages.post_logout_redirect_uris = 'Logout redirect Urls must be unique';
  }
  if (model.service.clientSecret && (!isImplicitFlow && model.service.clientSecret !== currentService.clientSecret)) {
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
  try {
    const serviceModels = await buildCurrentServiceModel(req);

    const currentService = serviceModels.currentServiceModel;
    const { oldServiceConfigModel } = serviceModels;
    const model = await validate(req, currentService, oldServiceConfigModel);

    if (Object.keys(model.validationMessages).length > 0) {
      model.csrfToken = req.csrfToken();
      return res.render('services/views/serviceConfig', model);
    }

    const editedFields = Object.entries(oldServiceConfigModel)
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

    req.session.serviceConfigurationChanges = {};

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
    req.session.serviceConfigurationChanges.authFlowType = model.authFlowType;

    return res.redirect('review-service-configuration#');
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  getServiceConfig,
  postServiceConfig,
};
