const mockUtils = require('../../utils');

jest.mock('./../../../src/infrastructure/config', () => mockUtils.configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => mockUtils.loggerMockFactory());
jest.mock('./../../../src/infrastructure/applications');

const { getRequestMock, getResponseMock } = require('../../utils');
const { postServiceConfig } = require('../../../src/app/services/serviceConfig');
const { getServiceById, updateService } = require('../../../src/infrastructure/applications');
const logger = require('../../../src/infrastructure/logger');

const res = getResponseMock();

// Represents the getServiceById response.
const currentServiceInfo = {
  id: 'service1',
  name: 'service one',
  description: 'service description',
  relyingParty: {
    client_id: 'clientid',
    client_secret: 'dewier-thrombi-confounder-mikado',
    service_home: 'https://www.servicehome.com',
    postResetUrl: 'https://www.postreset.com',
    redirect_uris: [
      'https://www.redirect.com',
    ],
    post_logout_redirect_uris: [
      'https://www.logout.com',
    ],
    grant_types: [
      'implicit',
      'authorization_code',
    ],
    response_types: [
      'code',
    ],
    api_secret: 'dewier-thrombi-confounder-mikado',
    token_endpoint_auth_method: undefined,
  },
};

// Represents the current service in the "model" form for validation and comparison.
const currentServiceModel = {
  name: currentServiceInfo.name || '',
  description: currentServiceInfo.description || '',
  clientId: currentServiceInfo.relyingParty.client_id || '',
  clientSecret: currentServiceInfo.relyingParty.client_secret || '',
  serviceHome: currentServiceInfo.relyingParty.service_home || '',
  postResetUrl: currentServiceInfo.relyingParty.postResetUrl || '',
  redirectUris: currentServiceInfo.relyingParty.redirect_uris || [],
  postLogoutRedirectUris: currentServiceInfo.relyingParty.post_logout_redirect_uris || [],
  grantTypes: currentServiceInfo.relyingParty.grant_types || [],
  responseTypes: currentServiceInfo.relyingParty.response_types || [],
  apiSecret: currentServiceInfo.relyingParty.api_secret || '',
  tokenEndpointAuthMethod: currentServiceInfo.relyingParty.token_endpoint_auth_method === 'client_secret_post'
    ? 'client_secret_post' : null,
};

// Represents the request body and the updateService info.
const requestServiceInfo = {
  name: 'service two',
  description: 'service description',
  clientId: 'clientid2',
  clientSecret: 'outshine-wringing-imparting-submitted',
  serviceHome: 'https://www.servicehome2.com',
  postResetUrl: 'https://www.postreset2.com',
  redirect_uris: [
    'https://www.redirect.com',
    'https://www.redirect2.com',
  ],
  post_logout_redirect_uris: [
    'https://www.logout2.com',
  ],
  grant_types: [
    'implicit',
  ],
  response_types: [
    'code',
    'token',
  ],
  apiSecret: 'outshine-wringing-imparting-submitted',
  tokenEndpointAuthMethod: 'client_secret_post',
};

// Represents the model used for validation and the view.
const updatedServiceModel = {
  name: requestServiceInfo.name,
  description: currentServiceInfo.description,
  clientId: requestServiceInfo.clientId,
  clientSecret: requestServiceInfo.clientSecret,
  serviceHome: requestServiceInfo.serviceHome,
  postResetUrl: requestServiceInfo.postResetUrl,
  redirectUris: requestServiceInfo.redirect_uris,
  postLogoutRedirectUris: requestServiceInfo.post_logout_redirect_uris,
  grantTypes: requestServiceInfo.grant_types,
  responseTypes: requestServiceInfo.response_types,
  apiSecret: requestServiceInfo.apiSecret,
  tokenEndpointAuthMethod: requestServiceInfo.tokenEndpointAuthMethod,
};

/**
 * Creates a version of requestServiceInfo which only modifies the requested fields, the rest remain
 * the same as currentServiceInfo.
 *
 * @param {string[]} fields The fields (matching requestServiceInfo) that need to be modified.
 * @returns A version of requestServiceInfo where only the requested fields are being modified.
 */
const getModifiedRequestBody = (fields = []) => {
  // Throw an error if an invalid/unknown field is requested.
  const allowedFields = Object.keys(requestServiceInfo);
  if (fields.length > 1 && !fields.every((field) => allowedFields.includes(field))) {
    throw new Error(`One of the following fields entered are not in mock data: ${fields}`);
  }
  // Mappings for fields that do not follow the naming scheme of the "model" service data.
  const translations = {
    redirect_uris: 'redirectUris',
    post_logout_redirect_uris: 'postLogoutRedirectUris',
    grant_types: 'grantTypes',
    response_types: 'responseTypes',
  };
  // Create a version of requestServiceInfo which only alters the requested fields.
  return allowedFields.reduce((request, field) => {
    const modelField = Object.prototype.hasOwnProperty.call(translations, field) ? translations[field] : field;
    request[field] = fields.includes(field) ? updatedServiceModel[modelField] : currentServiceModel[modelField];
    return request;
  }, {});
};

describe('when editing the service configuration', () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      body: { ...requestServiceInfo },
      params: {
        sid: 'service1',
      },
    });

    updateService.mockReset();
    getServiceById.mockReset();
    getServiceById.mockReturnValueOnce({ ...currentServiceInfo }).mockReturnValueOnce(null);
    res.mockResetAll();
  });

  it('then it should render view with validation if service name not entered', async () => {
    req.body.name = undefined;

    await postServiceConfig(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/serviceConfig');
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: '/services/service1',
      csrfToken: 'token',
      currentNavigation: 'configuration',
      service: {
        ...updatedServiceModel,
        name: req.body.name,
      },
      serviceId: 'service1',
      userRoles: [],
      validationMessages: {
        name: 'Service name must be present',
      },
    });
  });

  it('then it should render view with validation if service home not a valid url', async () => {
    req.body.serviceHome = 'not-a-url';

    await postServiceConfig(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/serviceConfig');
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: '/services/service1',
      csrfToken: 'token',
      currentNavigation: 'configuration',
      service: {
        ...updatedServiceModel,
        serviceHome: req.body.serviceHome,
      },
      serviceId: 'service1',
      userRoles: [],
      validationMessages: {
        serviceHome: 'Please enter a valid home Url',
      },
    });
  });

  it('then it should render view with validation if clientId not entered', async () => {
    req.body.clientId = undefined;

    await postServiceConfig(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/serviceConfig');
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: '/services/service1',
      csrfToken: 'token',
      currentNavigation: 'configuration',
      service: {
        ...updatedServiceModel,
        clientId: req.body.clientId,
      },
      serviceId: 'service1',
      userRoles: [],
      validationMessages: {
        clientId: 'Client Id must be present',
      },
    });
  });

  it('then it should render view with validation if clientId is longer than 50 characters', async () => {
    const testClientId = 'a'.repeat(100);
    req.body.clientId = testClientId;

    await postServiceConfig(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/serviceConfig');
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: '/services/service1',
      csrfToken: 'token',
      currentNavigation: 'configuration',
      service: {
        ...updatedServiceModel,
        clientId: req.body.clientId,
      },
      serviceId: 'service1',
      userRoles: [],
      validationMessages: {
        clientId: 'Client Id must be 50 characters or less',
      },
    });
  });

  it('then it should render view with validation if clientId is not alphanumeric & hyphens', async () => {
    const testClientId = 't89-^&*2tIu-';
    req.body.clientId = testClientId;

    await postServiceConfig(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/serviceConfig');
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: '/services/service1',
      csrfToken: 'token',
      currentNavigation: 'configuration',
      service: {
        ...updatedServiceModel,
        clientId: req.body.clientId,
      },
      serviceId: 'service1',
      userRoles: [],
      validationMessages: {
        clientId: 'Client Id must only contain letters, numbers, and hyphens',
      },
    });
  });

  it('then it should update the service if clientId is alphanumeric & hyphens', async () => {
    const testClientId = 't89B-2tVuX-';
    req.body.clientId = testClientId;

    await postServiceConfig(req, res);

    expect(updateService.mock.calls).toHaveLength(1);
    expect(updateService.mock.calls[0][0]).toBe('service1');

    expect(updateService.mock.calls[0][1]).toEqual({
      ...requestServiceInfo,
      clientId: req.body.clientId,
    });
    expect(updateService.mock.calls[0][2]).toBe('correlationId');
  });

  it('then it should render view with validation if clientId is already in use by another service', async () => {
    const testClientId = 'existing-id';
    req.body.clientId = testClientId;

    // Change mock to return truthy on second call to mimic a service existing with the clientId.
    getServiceById.mockReset();
    getServiceById.mockReturnValueOnce(currentServiceInfo).mockReturnValueOnce({
      example: true,
    });

    await postServiceConfig(req, res);
    // getServiceById should be called twice to get service info and check clientId uniqueness.
    expect(getServiceById.mock.calls).toHaveLength(2);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/serviceConfig');
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: '/services/service1',
      csrfToken: 'token',
      currentNavigation: 'configuration',
      service: {
        ...updatedServiceModel,
        clientId: req.body.clientId,
      },
      serviceId: 'service1',
      userRoles: [],
      validationMessages: {
        clientId: 'Client Id is unavailable, try another',
      },
    });
  });

  it('then it should still update the service if only the clientId capitalisation has changed', async () => {
    req.body.clientId = 'cLiEnTiD';

    await postServiceConfig(req, res);
    // getServiceById should only be called once as the uniqueness check won't be used.
    expect(getServiceById.mock.calls).toHaveLength(1);
    expect(updateService.mock.calls).toHaveLength(1);
    expect(updateService.mock.calls[0][0]).toBe('service1');
    expect(updateService.mock.calls[0][1]).toEqual({
      ...requestServiceInfo,
      clientId: req.body.clientId,
    });
    expect(updateService.mock.calls[0][2]).toBe('correlationId');
  });

  it('then it should still update the service if the clientId has not been edited', async () => {
    req.body.clientId = 'clientid';

    await postServiceConfig(req, res);
    // getServiceById should only be called once as the uniqueness check won't be used.
    expect(getServiceById.mock.calls).toHaveLength(1);
    expect(updateService.mock.calls).toHaveLength(1);
    expect(updateService.mock.calls[0][0]).toBe('service1');
    expect(updateService.mock.calls[0][1]).toEqual({
      ...requestServiceInfo,
      clientId: req.body.clientId,
    });
    expect(updateService.mock.calls[0][2]).toBe('correlationId');
  });

  it('then it should render view with validation if redirect urls are not unique', async () => {
    req.body.redirect_uris = [
      'https://www.redirect.com',
      'https://www.redirect.com',
    ];

    await postServiceConfig(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/serviceConfig');
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: '/services/service1',
      csrfToken: 'token',
      currentNavigation: 'configuration',
      service: {
        ...updatedServiceModel,
        redirectUris: req.body.redirect_uris,
      },
      serviceId: 'service1',
      userRoles: [],
      validationMessages: {
        redirect_uris: 'Redirect Urls must be unique',
      },
    });
  });

  it('then validation should set the token auth method to "client_secret_post" if that is what it was set to when there is a validation error', async () => {
    req.body.tokenEndpointAuthMethod = 'client_secret_post';
    const testClientId = 't89-^&*2tIu-';
    req.body.clientId = testClientId;

    await postServiceConfig(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/serviceConfig');
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: '/services/service1',
      csrfToken: 'token',
      currentNavigation: 'configuration',
      service: {
        ...updatedServiceModel,
        clientId: req.body.clientId,
        tokenEndpointAuthMethod: req.body.tokenEndpointAuthMethod,
      },
      serviceId: 'service1',
      userRoles: [],
      validationMessages: {
        clientId: 'Client Id must only contain letters, numbers, and hyphens',
      },
    });
  });

  it('then validation should set the token auth method to null if it was set to "none" when there is a validation error', async () => {
    // none is the value on the form input, which should be translated to null.
    req.body.tokenEndpointAuthMethod = 'none';
    const testClientId = 't89-^&*2tIu-';
    req.body.clientId = testClientId;

    await postServiceConfig(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/serviceConfig');
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: '/services/service1',
      csrfToken: 'token',
      currentNavigation: 'configuration',
      service: {
        ...updatedServiceModel,
        clientId: req.body.clientId,
        tokenEndpointAuthMethod: null,
      },
      serviceId: 'service1',
      userRoles: [],
      validationMessages: {
        clientId: 'Client Id must only contain letters, numbers, and hyphens',
      },
    });
  });

  it('then it should update the service', async () => {
    await postServiceConfig(req, res);

    expect(updateService.mock.calls).toHaveLength(1);
    expect(updateService.mock.calls[0][0]).toBe('service1');

    expect(updateService.mock.calls[0][1]).toEqual(requestServiceInfo);
    expect(updateService.mock.calls[0][2]).toBe('correlationId');
  });

  it('then it should audit the service being edited', async () => {
    await postServiceConfig(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe('user@unit.test (id: user1) updated service configuration for service service two (id: service1)');
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: 'manage',
      subType: 'service-config-updated',
      userId: 'user1',
      userEmail: 'user@unit.test',
      editedService: 'service1',
      editedFields: Object.keys(currentServiceModel).filter((key) => key !== 'description').map((key) => {
        const isSecret = key.toLowerCase().includes('secret');
        return {
          name: key,
          oldValue: isSecret ? 'EXPUNGED' : currentServiceModel[key],
          newValue: isSecret ? 'EXPUNGED' : updatedServiceModel[key],
        };
      }),
    });
  });

  it('then it should return an empty array for the audit editedFields property, if no fields have been updated', async () => {
    req.body = getModifiedRequestBody();

    await postServiceConfig(req, res);
    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][1]).toHaveProperty('editedFields', []);
  });

  it('then it should return a single element in the audit editedFields array, if only one non-secret primitive field has been updated', async () => {
    req.body = getModifiedRequestBody(['name']);

    await postServiceConfig(req, res);
    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][1]).toHaveProperty('editedFields', [
      {
        name: 'name',
        oldValue: currentServiceModel.name,
        newValue: req.body.name,
      },
    ]);
  });

  it('then it should return a single element in the audit editedFields array, if only one non-secret array field has been updated', async () => {
    req.body = getModifiedRequestBody(['grant_types']);

    await postServiceConfig(req, res);
    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][1]).toHaveProperty('editedFields', [
      {
        name: 'grantTypes',
        oldValue: currentServiceModel.grantTypes,
        newValue: req.body.grant_types,
      },
    ]);
  });

  it('then it should return a single expunged element in the audit editedFields array, if only one secret field has been updated', async () => {
    req.body = getModifiedRequestBody(['clientSecret']);

    await postServiceConfig(req, res);
    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][1]).toHaveProperty('editedFields', [
      {
        name: 'clientSecret',
        oldValue: 'EXPUNGED',
        newValue: 'EXPUNGED',
      },
    ]);
  });

  it('then it should return multiple elements in the audit editedFields array, if multiple non-secret fields have been updated', async () => {
    req.body = getModifiedRequestBody(['name', 'clientId', 'response_types']);

    await postServiceConfig(req, res);
    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][1]).toHaveProperty('editedFields', [
      {
        name: 'name',
        oldValue: currentServiceModel.name,
        newValue: req.body.name,
      },
      {
        name: 'clientId',
        oldValue: currentServiceModel.clientId,
        newValue: req.body.clientId,
      },
      {
        name: 'responseTypes',
        oldValue: currentServiceModel.responseTypes,
        newValue: req.body.response_types,
      },
    ]);
  });

  it('then it should return multiple expunged elements in the audit editedFields array, if multiple secret fields have been updated', async () => {
    req.body = getModifiedRequestBody(['clientSecret', 'apiSecret']);

    await postServiceConfig(req, res);
    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][1]).toHaveProperty('editedFields', [
      {
        name: 'clientSecret',
        oldValue: 'EXPUNGED',
        newValue: 'EXPUNGED',
      },
      {
        name: 'apiSecret',
        oldValue: 'EXPUNGED',
        newValue: 'EXPUNGED',
      },
    ]);
  });

  it('then it should return a mix of explicit/expunged elements in the audit editedFields array, if a mix of secret/non-secret fields have been updated', async () => {
    req.body = getModifiedRequestBody(['name', 'clientId', 'clientSecret', 'response_types', 'apiSecret']);

    await postServiceConfig(req, res);
    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][1]).toHaveProperty('editedFields', [
      {
        name: 'name',
        oldValue: currentServiceModel.name,
        newValue: req.body.name,
      },
      {
        name: 'clientId',
        oldValue: currentServiceModel.clientId,
        newValue: req.body.clientId,
      },
      {
        name: 'clientSecret',
        oldValue: 'EXPUNGED',
        newValue: 'EXPUNGED',
      },
      {
        name: 'responseTypes',
        oldValue: currentServiceModel.responseTypes,
        newValue: req.body.response_types,
      },
      {
        name: 'apiSecret',
        oldValue: 'EXPUNGED',
        newValue: 'EXPUNGED',
      },
    ]);
  });
});
