const niceware = require('niceware');
const he = require('he');
const { Utils } = require('sequelize');
const logger = require('../../infrastructure/logger/index');
const {
  AUTHENTICATION_FLOWS,
  GRANT_TYPES,
  ACTIONS,
  TOKEN_ENDPOINT_AUTH_METHOD,
  ERROR_MESSAGES,
  REDIRECT_URLS_CHANGES,
} = require('../../constants/serviceConfigConstants');
const { getServiceById } = require('../../infrastructure/applications');
const {
  getUserServiceRoles,
  determineAuthFlowByRespType,
  processRedirectUris,
  processConfigurationTypes,
  isCorrectProtocol,
  isCorrectLength,
  isValidUrl,
  checkClientId,
} = require('./utils');

const {
  saveRedirectUrlsToStorage,
  deleteFromLocalStorage,
  retreiveRedirectUrlsFromStorage,
} = require('../../infrastructure/utils/serviceConfigCache');
const UrlValidator = require('./urlValidator');

const buildServiceModelFromObject = (service, sessionService = {}) => {
  let tokenEndpointAuthMethod = null;
  const { CLIENT_SECRET_POST, CLIENT_SECRET_BASIC } = TOKEN_ENDPOINT_AUTH_METHOD;
  const sessionValue = sessionService?.tokenEndpointAuthMethod?.newValue;
  const fallbackValue = service.relyingParty.token_endpoint_auth_method === CLIENT_SECRET_POST ? CLIENT_SECRET_POST : CLIENT_SECRET_BASIC;

  const responseTypes = (sessionService?.responseTypes?.newValue || service.relyingParty.response_types) || [];
  const authFlowType = determineAuthFlowByRespType(responseTypes);

  tokenEndpointAuthMethod = (sessionValue && (authFlowType === AUTHENTICATION_FLOWS.HYBRID_FLOW || authFlowType === AUTHENTICATION_FLOWS.AUTHORISATION_CODE_FLOW)) ? sessionValue : fallbackValue;

  let grantTypes = [];
  if (sessionService?.grantTypes?.newValue && authFlowType !== AUTHENTICATION_FLOWS.IMPLICIT_FLOW) {
    grantTypes = sessionService?.grantTypes?.newValue;
  } else {
    grantTypes = service.relyingParty?.grant_types || [];
  }

  const refreshToken = grantTypes.includes(GRANT_TYPES.REFRESH_TOKEN) ? GRANT_TYPES.REFRESH_TOKEN : null;

  return {
    name: service.name || '',
    description: service.description || '',
    clientId: (sessionService?.clientId?.newValue || service.relyingParty.client_id) || '',
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

const getSessionServiceForAmendChanges = async (req) => {
  if (req.query?.action === ACTIONS.AMEND_CHANGES) {
    let sessionService = req.session.serviceConfigurationChanges;
    try {
      const serviceConfigChangesKey = `${REDIRECT_URLS_CHANGES}_${req.session.passport.user.sub}_${req.params.sid}`;
      const redirectUrlsChanges = await retreiveRedirectUrlsFromStorage(serviceConfigChangesKey, req.params.sid);

      if (redirectUrlsChanges) {
        sessionService = { ...sessionService, ...redirectUrlsChanges };
      }
      return sessionService;
    } catch (error) {
      logger.error(`Error occurred while retrieving redirect URLs from local storage for service ID - ${req.params.sid}:`, error);
      return sessionService;
    }
  }
  return {};
};

const buildCurrentServiceModel = async (req) => {
  try {
    const sessionService = await getSessionServiceForAmendChanges(req);
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
    if (req.query.action !== ACTIONS.AMEND_CHANGES) {
      req.session.serviceConfigurationChanges = {};
      const serviceConfigChangesKey = `${REDIRECT_URLS_CHANGES}_${req.session.passport.user.sub}_${req.params.sid}`;
      await deleteFromLocalStorage(serviceConfigChangesKey);
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
  const manageRolesForService = await getUserServiceRoles(req);

  const responseTypes = processConfigurationTypes(req.body.response_types) || [];
  const selectedRedirects = processRedirectUris(req.body.redirect_uris) || [];
  const selectedLogout = processRedirectUris(req.body.post_logout_redirect_uris) || [];

  const authFlowType = determineAuthFlowByRespType(responseTypes);

  const isImplicitFlow = authFlowType === AUTHENTICATION_FLOWS.IMPLICIT_FLOW;
  const isAuthorisationCodeFlow = authFlowType === AUTHENTICATION_FLOWS.AUTHORISATION_CODE_FLOW;
  const isHybridFlow = authFlowType === AUTHENTICATION_FLOWS.HYBRID_FLOW;

  const refreshToken = (req.body.refresh_token && (isAuthorisationCodeFlow || isHybridFlow)) ? req.body.refresh_token : null;

  let grantTypes = [];

  if (isHybridFlow || isAuthorisationCodeFlow) {
    grantTypes = [GRANT_TYPES.AUTHORIZATION_CODE];
    if (refreshToken) {
      grantTypes.push(refreshToken);
    }
  } else if (isImplicitFlow) {
    grantTypes = [GRANT_TYPES.IMPLICIT];
  } else {
    grantTypes = oldService?.grantTypes;
  }

  let tokenEndpointAuthMethod;
  const { CLIENT_SECRET_POST, CLIENT_SECRET_BASIC } = TOKEN_ENDPOINT_AUTH_METHOD;

  if (isHybridFlow || isAuthorisationCodeFlow) {
    if (req.body.tokenEndpointAuthMethod === CLIENT_SECRET_POST) {
      tokenEndpointAuthMethod = CLIENT_SECRET_POST;
    } else {
      tokenEndpointAuthMethod = CLIENT_SECRET_BASIC;
    }
  } else if (isImplicitFlow) {
    tokenEndpointAuthMethod = CLIENT_SECRET_BASIC;
  } else {
    tokenEndpointAuthMethod = oldService?.tokenEndpointAuthMethod;
  }

  const model = {
    service: {
      name: currentService.name,
      description: currentService.description,
      clientId: he.decode(req.body.clientId),
      clientSecret: (isHybridFlow || isAuthorisationCodeFlow) ? req.body.clientSecret : oldService.clientSecret,
      serviceHome: (req.body.serviceHome || '').trim(),
      postResetUrl: (req.body.postResetUrl || '').trim(),
      redirectUris: selectedRedirects,
      postLogoutRedirectUris: selectedLogout,
      grantTypes: grantTypes || [],
      responseTypes,
      apiSecret: req.body.apiSecret,
      tokenEndpointAuthMethod,
      refreshToken,
    },
    authFlowType,
    backLink: `/services/${req.params.sid}`,
    validationMessages: {},
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentNavigation: 'configuration',
  };

  const { serviceHome, postResetUrl, clientId } = model.service;
  const urlValidator = new UrlValidator(serviceHome);

  const lengthResult = await isCorrectLength(urlValidator);
  if (serviceHome !== null && !lengthResult) {
    if (model.validationMessages.serviceHome !== '' && model.validationMessages.serviceHome !== undefined) {
      model.validationMessages.serviceHome += ERROR_MESSAGES.INVALID_HOME_LENTGH;
    } else {
      model.validationMessages.serviceHome = ERROR_MESSAGES.INVALID_HOME_LENTGH;
    }
  }
  const validUrl = await isValidUrl(urlValidator);
  if (serviceHome !== null && !validUrl) {
    if (serviceHome !== '') {
      if (model.validationMessages.serviceHome !== '' && model.validationMessages.serviceHome !== undefined) {
        model.validationMessages.serviceHome += ERROR_MESSAGES.INVALID_HOME_CHARACTERS;
      } else {
        model.validationMessages.serviceHome = ERROR_MESSAGES.INVALID_HOME_CHARACTERS;
      }
    } else {
      model.validationMessages.serviceHome = ERROR_MESSAGES.INVALID_HOME_URL;
    }
  }
  if (lengthResult && !validUrl) {
    const validProtocol = await isCorrectProtocol(urlValidator);
    if (!validProtocol) {
      if (model.validationMessages.serviceHome !== '' && model.validationMessages.serviceHome !== undefined) {
        model.validationMessages.serviceHome += ERROR_MESSAGES.INVALID_HOME_PROTOCOL;
      } else {
        model.validationMessages.serviceHome = ERROR_MESSAGES.INVALID_HOME_PROTOCOL;
      }
    }
  }

  if (!model.service.responseTypes || model.service.responseTypes.length === 0) {
    model.validationMessages.responseTypes = ERROR_MESSAGES.MISSING_RESPONSE_TYPE;
  } else if (model.service.responseTypes.length === 1 && model.service.responseTypes.includes('token')) {
    model.validationMessages.responseTypes = ERROR_MESSAGES.RESPONSE_TYPE_TOKEN_ERROR;
  }
  const postUrlValidator = new UrlValidator(postResetUrl);
  const isPostResetUrlValid = await isValidUrl(postUrlValidator);
  if (postResetUrl != null && !isPostResetUrlValid) {
    if (postResetUrl !== '') {
      if (model.validationMessages.postResetUrl !== '' && model.validationMessages.postResetUrl !== undefined) {
        model.validationMessages.postResetUrl += ERROR_MESSAGES.INVALID_RESETPASS_CHARACTERS;
      } else {
        model.validationMessages.postResetUrl = ERROR_MESSAGES.INVALID_RESETPASS_CHARACTERS;
      }
    }
  }
  const isPOstResetUrlToLength = await isCorrectLength(postUrlValidator);
  if (!isPOstResetUrlToLength) {
    if (model.validationMessages.postResetUrl !== '' && model.validationMessages.postResetUrl !== undefined) {
      model.validationMessages.postResetUrl += ERROR_MESSAGES.INVALID_RESETPASS_LENTGH;
    } else {
      model.validationMessages.postResetUrl = ERROR_MESSAGES.INVALID_RESETPASS_LENTGH;
    }
  }
  if (isPostResetUrlValid && isPOstResetUrlToLength) {
    const isPostResetUrlProtocol = await isCorrectProtocol(postUrlValidator);
    if (!isPostResetUrlProtocol) {
      if (model.validationMessages.postResetUrl !== '' && model.validationMessages.postResetUrl !== undefined) {
        model.validationMessages.postResetUrl += ERROR_MESSAGES.INVALID_RESETPASS_PROTOCOL;
      } else {
        model.validationMessages.postResetUrl = ERROR_MESSAGES.INVALID_RESETPASS_PROTOCOL;
      }
    }
  }
  if (!clientId) {
    model.validationMessages.clientId = ERROR_MESSAGES.MISSING_CLIENT_ID;
  } else if (!/^[A-Za-z0-9-]+$/.test(clientId)) {
    model.validationMessages.clientId = ERROR_MESSAGES.INVALID_CLIENT_ID;
  } else if (clientId.length > 50) {
    model.validationMessages.clientId = ERROR_MESSAGES.INVALID_CLIENT_ID_LENGTH;
  } else if (
    clientId.toLowerCase() !== currentService.clientId.toLowerCase()
    && await checkClientId(clientId, req.id)
  ) {
    // If getServiceById returns truthy, then that clientId is already in use.
    model.validationMessages.clientId = ERROR_MESSAGES.CLIENT_ID_UNAVAILABLE;
  }

  if (!model.service.redirectUris || !model.service.redirectUris.length > 0) {
    model.validationMessages.redirect_uris = ERROR_MESSAGES.MISSING_REDIRECT_URL;
  } else if (model.service.redirectUris.length > 0) {
    await Promise.all(model.service.redirectUris.map(async (x) => {
      const redirecturlValidator = new UrlValidator(x);
      const isRCorrectLength = await isCorrectLength(redirecturlValidator);
      const isCorrectUtl = await isValidUrl(redirecturlValidator);
      if (!isRCorrectLength) {
        if (model.validationMessages.redirect_uris !== '' && model.validationMessages.redirect_uris !== undefined) {
          model.validationMessages.redirect_uris += ERROR_MESSAGES.INVALID_REDIRECT_LENTGH;
        } else {
          model.validationMessages.redirect_uris = ERROR_MESSAGES.INVALID_REDIRECT_LENTGH;
        }
      }
      if (!isCorrectUtl) {
        if (model.validationMessages.redirect_uris !== '' && model.validationMessages.redirect_uris !== undefined) {
          model.validationMessages.redirect_uris += ERROR_MESSAGES.INVALID_REDIRECT_CHARACTERS;
        } else {
          model.validationMessages.redirect_uris = ERROR_MESSAGES.INVALID_REDIRECT_CHARACTERS;
        }
      }
      if (isCorrectUtl && isRCorrectLength) {
        const isValidProtocol = await isCorrectProtocol(redirecturlValidator);
        if (!isValidProtocol) {
          if (model.validationMessages.redirect_uris !== '' && model.validationMessages.redirect_uris !== undefined) {
            model.validationMessages.redirect_uris += ERROR_MESSAGES.INVALID_REDIRECT_PROTOCOL;
          } else {
            model.validationMessages.redirect_uris = ERROR_MESSAGES.INVALID_REDIRECT_PROTOCOL;
          }
        }
      }
    }));
  } else if (model.service.redirectUris.some((value, i) => model.service.redirectUris.indexOf(value) !== i)) {
    model.validationMessages.redirect_uris = ERROR_MESSAGES.REDIRECT_URLS_NOT_UNIQUE;
  }

  if (!model.service.postLogoutRedirectUris || !model.service.postLogoutRedirectUris.length > 0) {
    model.validationMessages.post_logout_redirect_uris = ERROR_MESSAGES.MISSING_POST_LOGOUT_URL;
  } else if (model.service.postLogoutRedirectUris.length > 0) {
    await Promise.all(model.service.postLogoutRedirectUris.map(async (x) => {
      const postRedirecturlValidator = new UrlValidator(x);
      const isRDCorrectLength = await isCorrectLength(postRedirecturlValidator);
      const estCorrect = await isValidUrl(postRedirecturlValidator);
      if (!isRDCorrectLength) {
        if (model.validationMessages.post_logout_redirect_uris !== '' || model.validationMessages.post_logout_redirect_uris !== undefined) {
          model.validationMessages.post_logout_redirect_uris += ERROR_MESSAGES.INVALID_LOGOUT_REDIRECT_LENTGH;
        } else {
          model.validationMessages.post_logout_redirect_uris = ERROR_MESSAGES.INVALID_LOGOUT_REDIRECT_LENTGH;
        }
      }
      if (estCorrect !== true) {
        if (model.validationMessages.post_logout_redirect_uris !== '' || model.validationMessages.post_logout_redirect_uris !== undefined) {
          model.validationMessages.post_logout_redirect_uris = ERROR_MESSAGES.INVALID_LOGOUT_REDIRECT_CHARACTERS;
        } else {
          model.validationMessages.post_logout_redirect_uris = ERROR_MESSAGES.INVALID_LOGOUT_REDIRECT_CHARACTERS;
        }
      }
      if (isRDCorrectLength && estCorrect) {
        const testRDProtocol = await isCorrectProtocol(postRedirecturlValidator);
        if (!testRDProtocol) {
          if (model.validationMessages.post_logout_redirect_uris !== '' || model.validationMessages.post_logout_redirect_uris !== undefined) {
            model.validationMessages.post_logout_redirect_uris += ERROR_MESSAGES.INVALID_LOGOUT_REDIRECT_PROTOCOL;
          } else {
            model.validationMessages.post_logout_redirect_uris = ERROR_MESSAGES.INVALID_LOGOUT_REDIRECT_PROTOCOL;
          }
        }
      }
    }));
  } else if (model.service.postLogoutRedirectUris.some((value, i) => model.service.postLogoutRedirectUris.indexOf(value) !== i)) {
    model.validationMessages.post_logout_redirect_uris = ERROR_MESSAGES.POST_LOGOUT_URL_NOT_UNIQUE;
  }
  if (model.service.clientSecret != null && ((isAuthorisationCodeFlow || isHybridFlow) && model.service.clientSecret !== currentService.clientSecret)) {
    try {
      const validateClientSecret = niceware.passphraseToBytes(model.service.clientSecret.split('-'));
      if (validateClientSecret.length < 8) {
        model.validationMessages.clientSecret = ERROR_MESSAGES.INVALID_CLIENT_SECRET;
      }
    } catch (e) {
      model.validationMessages.clientSecret = ERROR_MESSAGES.INVALID_CLIENT_SECRET;
    }
  }

  if (model.service.apiSecret && model.service.apiSecret !== currentService.apiSecret) {
    try {
      const validateApiSecret = niceware.passphraseToBytes(model.service.apiSecret.split('-'));
      if (validateApiSecret.length !== 8) {
        model.validationMessages.apiSecret = ERROR_MESSAGES.INVALID_API_SECRET;
      }
    } catch (e) {
      model.validationMessages.apiSecret = ERROR_MESSAGES.INVALID_API_SECRET;
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
    const redirectUrlsChanges = {};
    editedFields.forEach(({
      name, oldValue, newValue, isSecret, secretNewValue,
    }) => {
      if (name === 'redirectUris' || name === 'postLogoutRedirectUris') {
        if (!redirectUrlsChanges[name]) {
          redirectUrlsChanges[name] = {};
        }
        redirectUrlsChanges[name].oldValue = oldValue;
        redirectUrlsChanges[name].newValue = newValue;
      } else {
        if (!req.session.serviceConfigurationChanges[name]) {
          req.session.serviceConfigurationChanges[name] = {};
        }
        req.session.serviceConfigurationChanges[name].oldValue = oldValue;
        req.session.serviceConfigurationChanges[name].newValue = newValue;
        if (isSecret) {
          req.session.serviceConfigurationChanges[name].secretNewValue = secretNewValue;
        }
      }
    });

    if (Object.keys(redirectUrlsChanges).length > 0) {
      const serviceConfigChangesKey = `${REDIRECT_URLS_CHANGES}_${req.session.passport.user.sub}_${req.params.sid}`;
      await saveRedirectUrlsToStorage(serviceConfigChangesKey, redirectUrlsChanges, req.params.sid);
    }
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
