// eslint-disable-next-line global-require
jest.mock('./../../../src/infrastructure/config', () => require('../../utils').configMockFactory());
// eslint-disable-next-line global-require
jest.mock('./../../../src/infrastructure/logger', () => require('../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/applications');
jest.mock('../../../src/app/services/utils');
jest.mock('../../../src/infrastructure/utils/serviceConfigCache', () => ({
  retreiveRedirectUrlsFromStorage: jest.fn(),
  deleteFromLocalStorage: jest.fn(),

}));

const { getRequestMock, getResponseMock } = require('../../utils');
const { getConfirmServiceConfig } = require('../../../src/app/services/confirmServiceConfig');
const { getServiceById } = require('../../../src/infrastructure/applications');
const { getUserServiceRoles } = require('../../../src/app/services/utils');

const {
  retreiveRedirectUrlsFromStorage,
} = require('../../../src/infrastructure/utils/serviceConfigCache');

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
      session: {
        passport: {
          user: {
            sub: 'user_id_uuid',
          },
        },
      },
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
    retreiveRedirectUrlsFromStorage.mockReset();
    retreiveRedirectUrlsFromStorage.mockReturnValue({
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
    });

    res.mockResetAll();
    req.session.serviceConfigurationChanges = {
      authFlowType: 'authorisationCodeFlow',
      serviceHome: {
        newValue: 'https://new-service-home.com',
        oldValue: 'http://old-service-home.com',
      },
      postResetUrl: { oldValue: 'https://www.postreset.com', newValue: 'https://new-post-reset-url' },
      refreshToken: {
        oldValue: undefined,
        newValue: 'refresh_token',
      },
      responseTypes: {
        oldValue: ['code', 'id_token'],
        newValue: ['token', 'id_token'],
      },
      grantTypes: {
        newValue: ['authorisation_code', 'refresh_token'],
        oldValue: ['implicit', 'authorization_code'],
        serviceHome: {
          oldValue: 'http://old-service-home.com',
          newValue: 'http://new-service-home.com',
        },
      },
      apiSecret: {
        oldValue: 'EXPUNGED',
        newValue: 'EXPUNGED',
        secretNewValue: 'outshine-wringing-imparting-submitted',
      },
      clientSecret: {
        oldValue: 'EXPUNGED',
        newValue: 'EXPUNGED',
        secretNewValue: 'outshine-wringing-imparting-submitted',
      },
      tokenEndpointAuthMethod: {
        oldValue: null,
        newValue: 'client_secret_post',
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

  it('then it should include the service name in the model', async () => {
    await getConfirmServiceConfig(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      service: {
        name: 'service one',
      },
    });
  });

  it('then it should include sorted serviceChanges, with the right description and the right change link in the model', async () => {
    await getConfirmServiceConfig(req, res);

    const { serviceChanges } = res.render.mock.calls[0][1];

    expect(serviceChanges).toBeDefined();
    expect(serviceChanges).toBeInstanceOf(Array);
    expect(serviceChanges.length).toEqual(10);

    expect(serviceChanges).toMatchObject([
      {
        addedValues: [
          'https://new-service-home.com',
        ],
        changeLink: '/services/service1/service-configuration?action=amendChanges#serviceHome-form-group',
        description: 'The home page of the service you want to configure. It is usually the service landing page from DfE Sign-in.',
        displayOrder: 1,
        newValue: 'https://new-service-home.com',
        oldValue: 'http://old-service-home.com',
        removedValues: [
          'http://old-service-home.com',
        ],
        title: 'Home URL',
      },
      {
        addedValues: [
          'https://new-post-reset-url',
        ],
        changeLink: '/services/service1/service-configuration?action=amendChanges#postResetUrl-form-group',
        description: 'Where you want to redirect users after they have reset their password. It is usually the DfE Sign-in home page.',
        displayOrder: 2,
        newValue: 'https://new-post-reset-url',
        oldValue: 'https://www.postreset.com',
        removedValues: [
          'https://www.postreset.com',
        ],
        title: 'Post password-reset URL',
      },
      {
        addedValues: [
          'token',
        ],
        changeLink: '/services/service1/service-configuration?action=amendChanges#response_types-form-group',
        description: 'A value that determines the authentication flow.',
        displayOrder: 5,
        newValue: [
          'token',
          'id_token',
        ],
        oldValue: [
          'code',
          'id_token',
        ],
        removedValues: [
          'code',
        ],
        title: 'Response types',
      },
      {
        addedValues: [],
        changeLink: '/services/service1/service-configuration?action=amendChanges#refresh_token-form-group',
        description: 'Select this field if you want to get new access tokens when they have expired without interaction with the user.',
        displayOrder: 6,
        newValue: 'refresh_token',
        oldValue: undefined,
        removedValues: [],
        title: 'Refresh token',
      },
      {
        addedValues: [
          'authorisation_code',
          'refresh_token',
        ],
        changeLink: '/services/service1/undefined',
        newValue: [
          'authorisation_code',
          'refresh_token',
        ],
        oldValue: [
          'implicit',
          'authorization_code',
        ],
        removedValues: [
          'implicit',
          'authorization_code',
        ],
        serviceHome: {
          newValue: 'http://new-service-home.com',
          oldValue: 'http://old-service-home.com',
        },
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
        addedValues: [
          'http://new-logout-url-1.com',
          'http://new-logout-url-2.com',
        ],
        changeLink: '/services/service1/service-configuration?action=amendChanges#post_logout_redirect_uris-form-group',
        description: 'Where you want to redirect users after they log out of a service.',
        displayOrder: 4,
        newValue: [
          'http://new-logout-url-1.com',
          'http://new-logout-url-2.com',
        ],
        oldValue: [
          'http://old-logout-url-1.com',
        ],
        removedValues: [
          'http://old-logout-url-1.com',
        ],
        title: 'Logout redirect URL',
      },
      {
        addedValues: [],
        changeLink: '/services/service1/service-configuration?action=amendChanges#clientSecret-form-group',
        description: 'A value that is created automatically by the system and acts as a password for the service.',
        displayOrder: 7,
        newValue: 'EXPUNGED',
        oldValue: 'EXPUNGED',
        removedValues: [],
        secretNewValue: 'outshine-wringing-imparting-submitted',
        title: 'Client secret',
      },
      {
        addedValues: [
          'client_secret_post',
        ],
        changeLink: '/services/service1/service-configuration?action=amendChanges#tokenEndpointAuthMethod-form-group',
        description: 'The way your service authenticates to the DfE Sign-in token endpoint. Select the method that applies.',
        displayOrder: 8,
        newValue: 'client_secret_post',
        oldValue: null,
        removedValues: [],
        title: 'Token endpoint authentication method',
      },
      {
        addedValues: [],
        changeLink: '/services/service1/service-configuration?action=amendChanges#apiSecret-form-group',
        description: 'A value that is created automatically by the system and acts as a password for the DfE Sign-in public API.',
        displayOrder: 9,
        newValue: 'EXPUNGED',
        oldValue: 'EXPUNGED',
        removedValues: [],
        secretNewValue: 'outshine-wringing-imparting-submitted',
        title: 'API secret',
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
