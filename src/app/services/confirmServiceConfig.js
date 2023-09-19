const niceware = require('niceware');
const { getServiceById, updateService } = require('../../infrastructure/applications');
const logger = require('../../infrastructure/logger');
const { getUserServiceRoles } = require('./utils');

const serviceConfigChangesSummaryDetails = {
  serviceHome: {
    title: 'Home URL',
    description: 'The home page of the service you want to configure. It is usually the service landing page from DfE Sign-in.',
    changeLink: 'service-configuration?action=amendChanges#serviceHome-form-group',
    displayOrder: 1,
  },
  postResetUrl: {
    title: 'Post password-reset URL',
    description: 'Where you want to redirect users after they have reset their password. It is usually the DfE Sign-in home page.',
    changeLink: 'service-configuration?action=amendChanges#postResetUrl-form-group',
    displayOrder: 2,
  },
  redirectUris: {
    title: 'Redirect URL',
    description: 'Where you want to redirect users after they have authenticated.',
    changeLink: 'service-configuration?action=amendChanges#redirect_uris-form-group',
    displayOrder: 3,
  },
  postLogoutRedirectUris: {
    title: 'Logout redirect URL',
    description: 'Where you want to redirect users after they log out of a service.',
    changeLink: 'service-configuration?action=amendChanges#post_logout_redirect_uris-form-group',
    displayOrder: 4,
  },
  responseTypes: {
    title: 'Response types',
    description: 'A value that determines the authentication flow.',
    changeLink: 'service-configuration?action=amendChanges#response_types-form-group',
    displayOrder: 5,
  },
  grantTypes: {
    title: 'Grant types',
    description: 'Grant types placeholder description.',
    changeLink: 'service-configuration?action=amendChanges#clientSecret-form-group',
    displayOrder: 6,
  },
  apiSecret: {
    title: 'API Secret',
    description: 'A value that is created automatically by the system and acts as a password for the DfE Sign-in public API.',
    changeLink: 'service-configuration?action=amendChanges#apiSecret-form-group',
    displayOrder: 7,
  },
};

const getServiceConfigMapping = (key, sid) => {
  const mapping = { ...serviceConfigChangesSummaryDetails[key] };
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
  }

  return { addedValues, removedValues };
};

const createFlattenedMappedServiceConfigChanges = (serviceConfigurationChanges, sid) => Object.entries(serviceConfigurationChanges).map(([key, value]) => {
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
});

const buildCurrentServiceModel = async (req) => {
  const service = await getServiceById(req.params.sid, req.id);
  return {
    name: service.name || '',
    clientSecret: service.relyingParty.client_secret || '',
    apiSecret: service.relyingParty.api_secret || '',
  };
};

const validate = async (req, currentService) => {
  const urlValidation = /^https?:\/\/(.*)/;
  const manageRolesForService = await getUserServiceRoles(req);

  const { serviceConfigurationChanges } = req.session;

  let grantTypes = serviceConfigurationChanges.grantTypes?.newValue;
  if (grantTypes && !(grantTypes instanceof Array)) {
    grantTypes = [serviceConfigurationChanges.grantTypes.newValue];
  }

  let responseTypes = serviceConfigurationChanges.responseTypes?.newValue;
  if (responseTypes && !(responseTypes instanceof Array)) {
    responseTypes = [serviceConfigurationChanges.responseTypes?.newValue];
  }

  let selectedRedirects = serviceConfigurationChanges.redirectUris?.newValue;
  if (selectedRedirects) {
    selectedRedirects = Array.isArray(selectedRedirects) ? selectedRedirects : [selectedRedirects];
    selectedRedirects = selectedRedirects.filter((x) => x.trim() !== '');
  }

  let selectedLogout = serviceConfigurationChanges.postLogoutRedirectUris?.newValue;
  if (selectedLogout) {
    selectedLogout = Array.isArray(selectedLogout) ? selectedLogout : [selectedLogout];
    selectedLogout = selectedLogout.filter((x) => x.trim() !== '');
  }

  const model = {
    service: {
      name: currentService.name,
      serviceHome: serviceConfigurationChanges?.serviceHome?.newValue,
      postResetUrl: serviceConfigurationChanges?.postResetUrl?.newValue,
      redirectUris: selectedRedirects,
      postLogoutRedirectUris: selectedLogout,
      grantTypes,
      responseTypes,
      apiSecret: serviceConfigurationChanges?.apiSecret?.secretNewValue,
      clientSecret: serviceConfigurationChanges?.clientSecret?.secretNewValue,
      tokenEndpointAuthMethod: req.body.tokenEndpointAuthMethod === 'client_secret_post' ? 'client_secret_post' : null,
    },
    backLink: `/services/${req.params.sid}/service-configuration`,
    cancelLink: `/services/${req.params.sid}`,
    validationMessages: {},
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentNavigation: 'configuration',
  };

  if (!serviceConfigurationChanges || Object.keys(serviceConfigurationChanges).length === 0) {
    model.validationMessages.noChangesMade = 'No changes have been made';
  }

  if (model.service.serviceHome && !urlValidation.test(model.service.serviceHome)) {
    model.validationMessages.serviceHome = 'Please enter a valid home Url';
  }

  if (model.service.postResetUrl && !urlValidation.test(model.service.postResetUrl) && model.service?.postResetUrl.trim() !== '') {
    model.validationMessages.postResetUrl = 'Please enter a valid Post-reset Url';
  }

  if (model.service.redirectUris && model.service.redirectUris.some((x) => !urlValidation.test(x))) {
    model.validationMessages.redirect_uris = 'Invalid redirect Url';
  } else if (model.service.redirectUris && model.service.redirectUris.some((value, i) => model.service.redirectUris.indexOf(value) !== i)) {
    model.validationMessages.redirect_uris = 'Redirect Urls must be unique';
  }

  if (model.service.postLogoutRedirectUris && model.service.postLogoutRedirectUris.some((x) => !urlValidation.test(x))) {
    model.validationMessages.post_logout_redirect_uris = 'Invalid logout redirect Url';
  } else if (model.service.postLogoutRedirectUris && model.service.postLogoutRedirectUris.some((value, i) => model.service.postLogoutRedirectUris.indexOf(value) !== i)) {
    model.validationMessages.post_logout_redirect_uris = 'Logout redirect Urls must be unique';
  }
  if (model.service.clientSecret && model.service.clientSecret !== currentService.clientSecret) {
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

const getConfirmServiceConfig = async (req, res) => {
  if (!req.session.serviceConfigurationChanges) {
    return res.redirect(`/services/${req.params.sid}/service-configuration`);
  }
  try {
    const manageRolesForService = await getUserServiceRoles(req);
    const currentService = await buildCurrentServiceModel(req);

    const serviceChanges = createFlattenedMappedServiceConfigChanges(
      req.session.serviceConfigurationChanges,
      req.params.sid,
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
  if (!req.session.serviceConfigurationChanges) {
    return res.redirect(`/services/${req.params.sid}/service-configuration`);
  }

  const currentService = await buildCurrentServiceModel(req);
  const model = await validate(req, currentService);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render('services/views/confirmServiceConfig', model);
  }
  const editedFields = Object.entries(req.session.serviceConfigurationChanges)
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

  const updatedService = {
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

  res.flash('title', 'Success');
  res.flash('heading', 'Service configuration changed');
  res.flash('message', `Your changes to service configuration for ${model.service.name} have been saved.`);

  return res.redirect(`/services/${req.params.sid}`);
};

module.exports = {
  getConfirmServiceConfig,
  postConfirmServiceConfig,
};
