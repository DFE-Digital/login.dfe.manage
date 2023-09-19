// eslint-disable-next-line global-require
jest.mock('./../../../src/infrastructure/config', () => require('../../utils').configMockFactory());
// eslint-disable-next-line global-require
jest.mock('./../../../src/infrastructure/logger', () => require('../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/applications');
jest.mock('../../../src/app/services/utils');

const { getRequestMock, getResponseMock } = require('../../utils');
const { getConfirmServiceConfig } = require('../../../src/app/services/confirmServiceConfig');
const { getServiceById } = require('../../../src/infrastructure/applications');
const { getUserServiceRoles } = require('../../../src/app/services/utils');

const res = getResponseMock();

describe('when getting the Review service config changes page', () => {
  let req;

  beforeEach(() => {
    jest.clearAllMocks();
    req = getRequestMock({
      params: {
        sid: 'service1',
      },
      userServices: {
        roles: [{
          code: 'serviceid_serviceconfiguration',
        }],
      },
      query: {},
    });

    getServiceById.mockReset();
    getServiceById.mockReturnValue({
      id: 'service1',
      name: 'service one',
      description: 'service description',
      relyingParty: {
        token_endpoint_auth_method: 'test',
        client_id: 'clientid',
        client_secret: 'dewier-thrombi-confounder-mikado',
        api_secret: 'dewier-thrombi-confounder-mikado',
        service_home: 'http://old-service-home.com',
        postResetUrl: 'https://www.postreset.com',
        redirect_uris: [
          'https://www.redirect.com',
        ],
        post_logout_redirect_uris: [
          'http://old-logout-url-1.com',
        ],
        grant_types: [
          'implicit',
          'authorization_code',
        ],
        response_types: ['response-type-1', 'response-type-2', 'response-type-3'],
      },
    });
    getUserServiceRoles.mockReset();
    getUserServiceRoles.mockImplementation(() => Promise.resolve([]));

    res.mockResetAll();
    req.session.serviceConfigurationChanges = {
      postResetUrl: { oldValue: 'https://www.postreset.com', newValue: 'https://new-post-reset-url' },
      redirectUris: {
        oldValue: ['https://www.redirect.com'],
        newValue: ['https://www.new-redirect.com'],
      },
      postLogoutRedirectUris: {
        oldValue: [
          'http://old-logout-url-1.com',
        ],
        newValue: [
          'http://new-logout-url-1.com',
          'http://new-logout-url-2.com',
        ],
      },
      responseTypes: {
        oldValue: ['response-type-1', 'response-type-2', 'response-type-3'],
        newValue: ['response-type-2', 'response-type-3'],
      },
      serviceHome: {
        oldValue: 'http://old-service-home.com',
        newValue: 'http://new-service-home.com',
      },
      apiSecret: {
        oldValue: 'EXPUNGED',
        newValue: 'EXPUNGED',
        secretNewValue: 'newsecret-value-interring-burnie',
      },
    };
  });

  it('then it should get the user service roles by calling getUserServiceRoles function', async () => {
    await getConfirmServiceConfig(req, res);

    expect(getUserServiceRoles).toHaveBeenCalledTimes(1);
  });

  it('then it should throw an error if unable to getUserServiceRoles', async () => {
    const errorMessage = 'Error fetching user roles';
    getUserServiceRoles.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    await expect(getConfirmServiceConfig(req, res)).rejects.toThrow(new RegExp(errorMessage, 'i'));
  });

  it('then it should get the service by id', async () => {
    await getConfirmServiceConfig(req, res);

    expect(getServiceById.mock.calls).toHaveLength(1);
    expect(getServiceById.mock.calls[0][0]).toBe('service1');
    expect(getServiceById.mock.calls[0][1]).toBe('correlationId');
  });

  it('should throw an error when unable to get the service by id', async () => {
    const errorMessage = 'Error fetching service by ID';

    getServiceById.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    await expect(getConfirmServiceConfig(req, res)).rejects.toThrow(new RegExp(errorMessage, 'i'));
  });

  it('then it should include csrf token in model', async () => {
    await getConfirmServiceConfig(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('then it should set the back link correctly in the model', async () => {
    await getConfirmServiceConfig(req, res);

    expect(res.render.mock.calls[0][1].backLink).toBe('/services/service1/service-configuration');
  });

  it('then it should set the cancel link correctly in the model', async () => {
    await getConfirmServiceConfig(req, res);

    expect(res.render.mock.calls[0][1].cancelLink).toBe('/services/service1');
  });

  it('then it should include user roles in the model', async () => {
    const mockRoles = ['userConfigRole'];
    getUserServiceRoles.mockImplementation(() => Promise.resolve(mockRoles));

    await getConfirmServiceConfig(req, res);
    expect(res.render.mock.calls[0][1].userRoles).toEqual(mockRoles);
  });

  it('then it should set currentNavigation to "configuration"', async () => {
    await getConfirmServiceConfig(req, res);

    expect(res.render.mock.calls[0][1].currentNavigation).toEqual('configuration');
  });

  it('then it should include the service name, service client secret and api secret in the model', async () => {
    await getConfirmServiceConfig(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      service: {
        name: 'service one',
        clientSecret: 'dewier-thrombi-confounder-mikado',
        apiSecret: 'dewier-thrombi-confounder-mikado',
      },
    });
  });

  it('then it should include sorted serviceChanges, with the right description and the right change link in the model', async () => {
    await getConfirmServiceConfig(req, res);

    const { serviceChanges } = res.render.mock.calls[0][1];

    expect(serviceChanges).toBeDefined();
    expect(serviceChanges).toBeInstanceOf(Array);
    expect(serviceChanges.length).toEqual(6);

    expect(serviceChanges).toMatchObject([
      {
        title: 'Home URL',
        description: 'The home page of the service you want to configure.',
        changeLink: '/services/service1/service-configuration?action=amendChanges#serviceHome-form-group',
        displayOrder: 1,
        oldValue: 'http://old-service-home.com',
        newValue: 'http://new-service-home.com',
        addedValues: ['http://new-service-home.com'],
        removedValues: ['http://old-service-home.com'],
      },
      {
        title: 'Post password-reset URL',
        description: 'Where you want to redirect users after they have reset their password.',
        changeLink: '/services/service1/service-configuration?action=amendChanges#postResetUrl-form-group',
        displayOrder: 2,
        oldValue: 'https://www.postreset.com',
        newValue: 'https://new-post-reset-url',
        addedValues: ['https://new-post-reset-url'],
        removedValues: ['https://www.postreset.com'],
      },
      {
        addedValues: [
          'https://www.new-redirect.com',
        ],
        changeLink: '/services/service1/service-configuration?action=amendChanges#redirect_uris-form-group',
        description: 'Where you want to redirect users after they have authenticated.',
        displayOrder: 3,
        newValue: [
          'https://www.new-redirect.com',
        ],
        oldValue: [
          'https://www.redirect.com',
        ],
        removedValues: [
          'https://www.redirect.com',
        ],
        title: 'Redirect URL',
      },
      {
        title: 'Logout redirect URL',
        description: 'Where you want to redirect users after they log out of a service.',
        changeLink: '/services/service1/service-configuration?action=amendChanges#post_logout_redirect_uris-form-group',
        displayOrder: 4,
        oldValue: ['http://old-logout-url-1.com'],
        newValue: ['http://new-logout-url-1.com', 'http://new-logout-url-2.com'],
        addedValues: ['http://new-logout-url-1.com', 'http://new-logout-url-2.com'],
        removedValues: ['http://old-logout-url-1.com'],
      },
      {

        oldValue: ['response-type-1', 'response-type-2', 'response-type-3'],
        newValue: ['response-type-2', 'response-type-3'],
        displayOrder: 5,
        removedValues: [
          'response-type-1',
        ],
        title: 'Response types',
        description: 'A value that determines the authentication flow.',
        changeLink: '/services/service1/service-configuration?action=amendChanges#response_types-form-group',
      },
      {
        title: 'API Secret',
        description: 'A value that is created automatically by the system and acts as a password for the DfE Sign-in public API.',
        changeLink: '/services/service1/service-configuration?action=amendChanges#apiSecret-form-group',
        displayOrder: 7,
        oldValue: 'EXPUNGED',
        newValue: 'EXPUNGED',
        addedValues: [],
        removedValues: [],
        secretNewValue: 'newsecret-value-interring-burnie',
      },

    ]);
  });

  it('then it should redirect to service configuration page if there are no changes stored in session', async () => {
    req.session.serviceConfigurationChanges = undefined;
    await getConfirmServiceConfig(req, res);

    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith('/services/service1/service-configuration');
  });

  it('then it should display the service config view', async () => {
    await getConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/confirmServiceConfig');
  });
});
