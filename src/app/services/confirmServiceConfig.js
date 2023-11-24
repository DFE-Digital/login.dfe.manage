const niceware = require('niceware');
const { getServiceById, updateService } = require('../../infrastructure/applications');
const logger = require('../../infrastructure/logger');
const {
  getUserServiceRoles,
  processRedirectUris,
  processConfigurationTypes,
  isValidUrl,
} = require('./utils');
const {
  AUTHENTICATION_FLOWS,
  ERROR_MESSAGES,
  SERVICE_CONFIG_CHANGES_SUMMARY_DETAILS,
  TOKEN_ENDPOINT_AUTH_METHOD,
  REDIRECT_URLS_CHANGES,
} = require('../../constants/serviceConfigConstants');

const {
  deleteFromLocalStorage,
  retreiveRedirectUrlsFromStorage,
} = require('../../infrastructure/utils/serviceConfigCache');

const getServiceConfigMapping = (key, sid) => {
  const mapping = { ...SERVICE_CONFIG_CHANGES_SUMMARY_DETAILS[key] };
  if (mapping) {
    mapping.changeLink = `/services/${sid}/${mapping.changeLink}`;
  }
  return mapping;
};

const getAddedAndRemovedValues = (oldValue, newValue) => {
  let addedValues = [];
  let removedValues = [];

  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    addedValues = newValue.filter((v) => !oldValue.includes(v));
    removedValues = oldValue.filter((v) => !newValue.includes(v));
  } else if (typeof oldValue === 'string' && typeof newValue === 'string') {
    if (oldValue !== newValue) {
      addedValues = newValue === '' ? [] : [newValue];
      removedValues = oldValue === '' ? [] : [oldValue];
    }
  } else if ((oldValue === null && typeof newValue === 'string') || (typeof oldValue === 'string' && newValue === null)) {
    addedValues = newValue === null ? [] : [newValue];
    removedValues = oldValue === null ? [] : [oldValue];
  }

  return { addedValues, removedValues };
};

const createFlattenedMappedServiceConfigChanges = (serviceConfigurationChanges, sid, authFlowType) => Object.entries(serviceConfigurationChanges)
  .map(([key, value]) => {
    // if flow changed to implicit flow,then the refresh token and tokenEndpointAuthMethod removed in the background and not displayed in the UI
    if (authFlowType === AUTHENTICATION_FLOWS.IMPLICIT_FLOW && (key === 'refreshToken' || key === 'tokenEndpointAuthMethod')) {
      return null;
    }

    const mapping = getServiceConfigMapping(key, sid);

    if (mapping) {
      const { oldValue, newValue } = value;
      const { addedValues, removedValues } = getAddedAndRemovedValues(oldValue, newValue);

      return {
        ...value,
        ...mapping,
        addedValues,
        removedValues,
      };
    }

    return value;
  })
  .filter((mappedValue) => mappedValue !== null); // Filter out null entries

const buildCurrentServiceModel = async (req) => {
  const service = await getServiceById(req.params.sid, req.id);
  return {
    name: service.name || '',
  };
};

const validate = async (req, currentService) => {
  try {
    const manageRolesForService = await getUserServiceRoles(req);

    let { serviceConfigurationChanges } = req.session;
    const serviceConfigChangesKey = `${REDIRECT_URLS_CHANGES}_${req.session.passport.user.sub}_${req.params.sid}`;
    const redirectUrlsChanges = await retreiveRedirectUrlsFromStorage(serviceConfigChangesKey, req.params.sid);

    // adding redirectUrlsChanges if they exist
    serviceConfigurationChanges = redirectUrlsChanges ? { ...serviceConfigurationChanges, ...redirectUrlsChanges } : serviceConfigurationChanges;

    const grantTypes = processConfigurationTypes(serviceConfigurationChanges.grantTypes?.newValue);
    const responseTypes = processConfigurationTypes(serviceConfigurationChanges.responseTypes?.newValue);
    const selectedRedirects = processRedirectUris(serviceConfigurationChanges.redirectUris?.newValue);
    const selectedLogout = processRedirectUris(serviceConfigurationChanges.postLogoutRedirectUris?.newValue);

    let tokenEndpointAuthMethod;

    if (serviceConfigurationChanges?.tokenEndpointAuthMethod?.newValue !== undefined) {
      tokenEndpointAuthMethod = serviceConfigurationChanges.tokenEndpointAuthMethod.newValue === 'client_secret_post'
        ? 'client_secret_post'
        : null;
    } else {
      tokenEndpointAuthMethod = undefined;
    }

    const model = {
      service: {
        name: currentService.name,
        serviceHome: serviceConfigurationChanges?.serviceHome?.newValue,
        postResetUrl: serviceConfigurationChanges?.postResetUrl?.newValue,
        clientId: serviceConfigurationChanges?.clientId?.newValue,
        redirectUris: selectedRedirects,
        postLogoutRedirectUris: selectedLogout,
        grantTypes,
        responseTypes,
        apiSecret: serviceConfigurationChanges?.apiSecret?.secretNewValue,
        clientSecret: serviceConfigurationChanges?.clientSecret?.secretNewValue,
        tokenEndpointAuthMethod,
      },
      backLink: `/services/${req.params.sid}/service-configuration`,
      cancelLink: `/services/${req.params.sid}`,
      validationMessages: {},
      serviceId: req.params.sid,
      userRoles: manageRolesForService,
      currentNavigation: 'configuration',
    };

    if (Object.keys(serviceConfigurationChanges).length === 1 && 'authFlowType' in serviceConfigurationChanges) {
      model.validationMessages.noChangesMade = ERROR_MESSAGES.NO_CHANGES_MADE;
    }

    const { serviceHome, postResetUrl, clientId } = model.service;
    if (serviceHome && !isValidUrl(serviceHome)) {
      model.validationMessages.serviceHome = ERROR_MESSAGES.INVALID_HOME_URL;
    }

    if (postResetUrl && !isValidUrl(postResetUrl)) {
      model.validationMessages.postResetUrl = ERROR_MESSAGES.INVALID_POST_PASSWORD_RESET_URL;
    }

    if (clientId && clientId.length > 50) {
      model.validationMessages.clientId = ERROR_MESSAGES.INVALID_CLIENT_ID_LENGTH;
    } else if (clientId && !/^[A-Za-z0-9-]+$/.test(clientId)) {
      model.validationMessages.clientId = ERROR_MESSAGES.INVALID_CLIENT_ID;
    } else if (clientId && clientId.toLowerCase() !== currentService.clientId.toLowerCase() && await getServiceById(clientId, req.id)
    ) {
      // If getServiceById returns truthy, then that clientId is already in use.
      model.validationMessages.clientId = ERROR_MESSAGES.CLIENT_ID_UNAVAILABLE;
    }

    if (model.service.responseTypes && model.service.responseTypes.length === 1 && model.service.responseTypes.includes('token')) {
      model.validationMessages.responseTypes = ERROR_MESSAGES.RESPONSE_TYPE_TOKEN_ERROR;
    }

    if (model.service.redirectUris && model.service.redirectUris.some((x) => !isValidUrl(x))) {
      model.validationMessages.redirect_uris = ERROR_MESSAGES.INVALID_REDIRECT_URL;
    } else if (model.service.redirectUris && model.service.redirectUris.some((value, i) => model.service.redirectUris.indexOf(value) !== i)) {
      model.validationMessages.redirect_uris = ERROR_MESSAGES.REDIRECT_URLS_NOT_UNIQUE;
    }

    if (model.service.postLogoutRedirectUris && model.service.postLogoutRedirectUris.some((x) => !isValidUrl(x))) {
      model.validationMessages.post_logout_redirect_uris = ERROR_MESSAGES.INVALID_POST_LOGOUT_URL;
    } else if (model.service.postLogoutRedirectUris && model.service.postLogoutRedirectUris.some((value, i) => model.service.postLogoutRedirectUris.indexOf(value) !== i)) {
      model.validationMessages.post_logout_redirect_uris = ERROR_MESSAGES.POST_LOGOUT_URL_NOT_UNIQUE;
    }
    if (model.service.clientSecret && model.service.clientSecret !== currentService.clientSecret) {
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
  } catch (error) {
    throw new Error(error);
  }
};

const getConfirmServiceConfig = async (req, res) => {
  const { sid } = req.params;
  if (!req.session.serviceConfigurationChanges) {
    return res.redirect(`/services/${sid}/service-configuration`);
  }
  try {
    const serviceConfigChangesKey = `${REDIRECT_URLS_CHANGES}_${req.session.passport.user.sub}_${req.params.sid}`;
    const manageRolesForService = await getUserServiceRoles(req);
    const currentService = await buildCurrentServiceModel(req);

    const authFlowTypeValue = req.session.serviceConfigurationChanges?.authFlowType;
    let serviceConfigChanges = req.session.serviceConfigurationChanges;

    const redirectUrlsChanges = await retreiveRedirectUrlsFromStorage(serviceConfigChangesKey, req.params.sid);

    serviceConfigChanges = redirectUrlsChanges ? { ...serviceConfigChanges, ...redirectUrlsChanges } : serviceConfigChanges;

    const { authFlowType, ...changedServiceParams } = serviceConfigChanges;

    const serviceChanges = createFlattenedMappedServiceConfigChanges(
      changedServiceParams,
      sid,
      authFlowTypeValue,
    );

    const sortedServiceChanges = serviceChanges.sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );

    return res.render('services/views/confirmServiceConfig', {
      csrfToken: req.csrfToken(),
      service: currentService,
      backLink: `/services/${req.params.sid}/service-configuration`,
      cancelLink: `/services/${req.params.sid}`,
      validationMessages: {},
      serviceId: req.params.sid,
      userRoles: manageRolesForService,
      currentNavigation: 'configuration',
      serviceChanges: sortedServiceChanges,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const postConfirmServiceConfig = async (req, res) => {
  try {
    if (!req.session.serviceConfigurationChanges) {
      return res.redirect(`/services/${req.params.sid}/service-configuration`);
    }

    const serviceConfigChangesKey = `${REDIRECT_URLS_CHANGES}_${req.session.passport.user.sub}_${req.params.sid}`;
    const currentService = await buildCurrentServiceModel(req);
    const model = await validate(req, currentService);

    if (Object.keys(model.validationMessages).length > 0) {
      model.csrfToken = req.csrfToken();
      return res.render('services/views/confirmServiceConfig', model);
    }

    // excluding the authFlowType from the req.session.serviceConfigurationChanges object
    const { authFlowType, ...serviceConfigChanges } = req.session.serviceConfigurationChanges;

    const redirectUrlsChanges = await retreiveRedirectUrlsFromStorage(serviceConfigChangesKey, req.params.sid);

    const serviceConfigurationChanges = redirectUrlsChanges ? { ...serviceConfigChanges, ...redirectUrlsChanges } : serviceConfigChanges;

    const editedFields = Object.entries(serviceConfigurationChanges)
      .filter(([field, oldValue]) => {
        const newValue = Array.isArray(model.service[field])
          ? model.service[field].sort()
          : model.service[field];

        return Array.isArray(oldValue)
          ? !(Array.isArray(newValue) && oldValue.length === newValue.length && oldValue.sort().every((value, index) => value === newValue[index]))
          : oldValue !== newValue;
      })
      .map(([field, change]) => {
        const isSecret = field.toLowerCase().includes('secret');
        const { oldValue, newValue } = change;
        return {
          name: field,
          oldValue: isSecret ? 'EXPUNGED' : oldValue,
          newValue: isSecret ? 'EXPUNGED' : newValue,
        };
      });

    const { CLIENT_SECRET_POST } = TOKEN_ENDPOINT_AUTH_METHOD;

    const updatedService = {
      clientSecret: model.service.clientSecret,
      serviceHome: model.service.serviceHome,
      clientId: model.service.clientId,
      postResetUrl: model.service.postResetUrl,
      redirect_uris: model.service.redirectUris,
      post_logout_redirect_uris: model.service.postLogoutRedirectUris,
      grant_types: model.service.grantTypes,
      response_types: model.service.responseTypes,
      apiSecret: model.service.apiSecret,
      // If tokenEndpointAuthMethod isn't 'client_secret_post', store NULL in the DB.
      tokenEndpointAuthMethod: model.service.tokenEndpointAuthMethod === CLIENT_SECRET_POST ? CLIENT_SECRET_POST : null,
    };

    await updateService(req.params.sid, updatedService, req.id);

    logger.audit(`${req.user.email} (id: ${req.user.sub}) updated service configuration for service ${model.service.name} (id: ${req.params.sid})`, {
      type: 'manage',
      subType: 'service-config-updated',
      userId: req.user.sub,
      userEmail: req.user.email,
      editedService: req.params.sid,
      editedFields,
    });

    await deleteFromLocalStorage(serviceConfigChangesKey);

    res.flash('title', 'Success');
    res.flash('heading', 'Service configuration changed');
    res.flash('message', `Your changes to service configuration for ${model.service.name} have been saved.`);

    return res.redirect(`/services/${req.params.sid}`);
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  getConfirmServiceConfig,
  postConfirmServiceConfig,
};
