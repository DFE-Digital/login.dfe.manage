jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/applications');

const { getRequestMock, getResponseMock } = require('./../../utils');
const postServiceConfig = require('./../../../src/app/services/serviceConfig').postServiceConfig;
const { getServiceById, updateService } = require('./../../../src/infrastructure/applications');
const logger = require('./../../../src/infrastructure/logger');

const res = getResponseMock();

describe('when editing the service configuration', () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      body: {
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
        ],
      },
      params: {
        sid: 'service1',
      }
    });

    updateService.mockReset();
    getServiceById.mockReset();
    getServiceById.mockReturnValueOnce({
      id: 'service1',
      name: 'service one',
      description: 'service description',
      relyingParty: {
        client_id: 'clientid',
        client_secret: 'dewier-thrombi-confounder-mikado',
        api_secret: 'dewier-thrombi-confounder-mikado',
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
          'authorization_code'
        ],
        response_types: [
          'code',
        ],
      },
    }).mockReturnValueOnce(null);
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
        clientId: 'clientid2',
        clientSecret: 'outshine-wringing-imparting-submitted',
        description: 'service description',
        grantTypes: [
          'implicit'
        ],
        postLogoutRedirectUris: [
          'https://www.logout2.com'
        ],
        postResetUrl: 'https://www.postreset2.com',
        redirectUris: [
          'https://www.redirect.com',
          'https://www.redirect2.com'
        ],
        responseTypes: [
          'code'
        ],
        serviceHome: 'https://www.servicehome2.com',
        tokenEndpointAuthMethod: null,
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
        name: 'service two',
        clientId: 'clientid2',
        clientSecret: 'outshine-wringing-imparting-submitted',
        description: 'service description',
        grantTypes: [
          'implicit'
        ],
        postLogoutRedirectUris: [
          'https://www.logout2.com'
        ],
        postResetUrl: 'https://www.postreset2.com',
        redirectUris: [
          'https://www.redirect.com',
          'https://www.redirect2.com'
        ],
        responseTypes: [
          'code'
        ],
        serviceHome: 'not-a-url',
        tokenEndpointAuthMethod: null,
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
        name: 'service two',
        clientId: undefined,
        clientSecret: 'outshine-wringing-imparting-submitted',
        description: 'service description',
        grantTypes: [
          'implicit'
        ],
        postLogoutRedirectUris: [
          'https://www.logout2.com'
        ],
        postResetUrl: 'https://www.postreset2.com',
        redirectUris: [
          'https://www.redirect.com',
          'https://www.redirect2.com'
        ],
        responseTypes: [
          'code'
        ],
        serviceHome: 'https://www.servicehome2.com',
        tokenEndpointAuthMethod: null,
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
        name: 'service two',
        clientId: testClientId,
        clientSecret: 'outshine-wringing-imparting-submitted',
        description: 'service description',
        grantTypes: [
          'implicit',
        ],
        postLogoutRedirectUris: [
          'https://www.logout2.com',
        ],
        postResetUrl: 'https://www.postreset2.com',
        redirectUris: [
          'https://www.redirect.com',
          'https://www.redirect2.com',
        ],
        responseTypes: [
          'code',
        ],
        serviceHome: 'https://www.servicehome2.com',
        tokenEndpointAuthMethod: null,
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
        name: 'service two',
        clientId: testClientId,
        clientSecret: 'outshine-wringing-imparting-submitted',
        description: 'service description',
        grantTypes: [
          'implicit',
        ],
        postLogoutRedirectUris: [
          'https://www.logout2.com',
        ],
        postResetUrl: 'https://www.postreset2.com',
        redirectUris: [
          'https://www.redirect.com',
          'https://www.redirect2.com',
        ],
        responseTypes: [
          'code',
        ],
        serviceHome: 'https://www.servicehome2.com',
        tokenEndpointAuthMethod: null,
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
      name: 'service two',
      description: 'service description',
      clientId: testClientId,
      clientSecret: 'outshine-wringing-imparting-submitted',
      serviceHome: 'https://www.servicehome2.com',
      postResetUrl: 'https://www.postreset2.com',
      tokenEndpointAuthMethod: null,
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
      ],
    });
    expect(updateService.mock.calls[0][2]).toBe('correlationId');
  });

  it('then it should render view with validation if clientId is already in use by another service', async () => {
    const testClientId = 'existing-id';
    req.body.clientId = testClientId;

    // Change mock to return truthy on second call to mimic a service existing with the clientId.
    getServiceById.mockReset();
    getServiceById.mockReturnValueOnce({
      id: 'service1',
      name: 'service one',
      description: 'service description',
      relyingParty: {
        client_id: 'clientid',
        client_secret: 'dewier-thrombi-confounder-mikado',
        api_secret: 'dewier-thrombi-confounder-mikado',
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
      },
    }).mockReturnValueOnce({
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
        name: 'service two',
        clientId: testClientId,
        clientSecret: 'outshine-wringing-imparting-submitted',
        description: 'service description',
        grantTypes: [
          'implicit',
        ],
        postLogoutRedirectUris: [
          'https://www.logout2.com',
        ],
        postResetUrl: 'https://www.postreset2.com',
        redirectUris: [
          'https://www.redirect.com',
          'https://www.redirect2.com',
        ],
        responseTypes: [
          'code',
        ],
        serviceHome: 'https://www.servicehome2.com',
        tokenEndpointAuthMethod: null,
      },
      serviceId: 'service1',
      userRoles: [],
      validationMessages: {
        clientId: 'Client Id is unavailable, try another',
      },
    });
  });

  it('then it should still update the service if the clientId has not been edited', async () => {
    req.body.clientId = 'clientid';

    await postServiceConfig(req, res);
    // getServiceById should only be called once as the uniqueness check won't be used.
    expect(getServiceById.mock.calls).toHaveLength(1);
    expect(updateService.mock.calls).toHaveLength(1);
    expect(updateService.mock.calls[0][0]).toBe('service1');
    expect(updateService.mock.calls[0][1]).toEqual({
      name: 'service two',
      description: 'service description',
      clientId: 'clientid',
      clientSecret: 'outshine-wringing-imparting-submitted',
      serviceHome: 'https://www.servicehome2.com',
      postResetUrl: 'https://www.postreset2.com',
      tokenEndpointAuthMethod: null,
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
      ],
    });
    expect(updateService.mock.calls[0][2]).toBe('correlationId');
  });

  it('then it should render view with validation if redirect urls are not unique', async () => {
    req.body.redirect_uris =  [
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
        name: 'service two',
        clientId: 'clientid2',
        clientSecret: 'outshine-wringing-imparting-submitted',
        description: 'service description',
        grantTypes: [
          'implicit'
        ],
        postLogoutRedirectUris: [
          'https://www.logout2.com'
        ],
        postResetUrl: 'https://www.postreset2.com',
        redirectUris: [
          'https://www.redirect.com',
          'https://www.redirect.com'
        ],
        responseTypes: [
          'code'
        ],
        serviceHome: 'https://www.servicehome2.com',
        tokenEndpointAuthMethod: null,
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
        name: 'service two',
        clientId: testClientId,
        clientSecret: 'outshine-wringing-imparting-submitted',
        description: 'service description',
        grantTypes: [
          'implicit',
        ],
        postLogoutRedirectUris: [
          'https://www.logout2.com',
        ],
        postResetUrl: 'https://www.postreset2.com',
        redirectUris: [
          'https://www.redirect.com',
          'https://www.redirect2.com',
        ],
        responseTypes: [
          'code',
        ],
        serviceHome: 'https://www.servicehome2.com',
        tokenEndpointAuthMethod: 'client_secret_post',
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
        name: 'service two',
        clientId: testClientId,
        clientSecret: 'outshine-wringing-imparting-submitted',
        description: 'service description',
        grantTypes: [
          'implicit',
        ],
        postLogoutRedirectUris: [
          'https://www.logout2.com',
        ],
        postResetUrl: 'https://www.postreset2.com',
        redirectUris: [
          'https://www.redirect.com',
          'https://www.redirect2.com',
        ],
        responseTypes: [
          'code',
        ],
        serviceHome: 'https://www.servicehome2.com',
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

    expect(updateService.mock.calls[0][1]).toEqual({
      name: 'service two',
      description: 'service description',
      clientId: 'clientid2',
      clientSecret: 'outshine-wringing-imparting-submitted',
      serviceHome: 'https://www.servicehome2.com',
      postResetUrl: 'https://www.postreset2.com',
      tokenEndpointAuthMethod: null,
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
      ],
    });
    expect(updateService.mock.calls[0][2]).toBe('correlationId');
  });

  it('then it should should audit service being edited', async () => {
    await postServiceConfig(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe('user@unit.test (id: user1) updated service configuration for service service two (id: service1)');
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: 'manage',
      subType: 'service-config-updated',
      userId: 'user1',
      userEmail: 'user@unit.test',
      editedService: 'service1',
    });
  });

});
