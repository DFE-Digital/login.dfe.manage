const mockUtils = require('../../utils');

jest.mock('./../../../src/infrastructure/config', () => mockUtils.configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => mockUtils.loggerMockFactory());
jest.mock('./../../../src/infrastructure/applications');
jest.mock('../../../src/app/services/utils', () => {
  const actualUtilsFunctions = jest.requireActual('../../../src/app/services/utils');
  return {
    ...actualUtilsFunctions,
    processRedirectUris: jest.fn(actualUtilsFunctions.processRedirectUris),
    determineAuthFlowByRespType: jest.fn(actualUtilsFunctions.determineAuthFlowByRespType),
    getUserServiceRoles: jest.fn(actualUtilsFunctions.getUserServiceRoles),
    processConfigurationTypes: jest.fn(actualUtilsFunctions.processConfigurationTypes),
    isValidUrl: jest.fn(actualUtilsFunctions.isValidUrl),
  };
});

jest.mock('../../../src/infrastructure/utils/serviceConfigCache', () => ({
  retreiveRedirectUrlsFromStorage: jest.fn(),
  deleteFromLocalStorage: jest.fn(),

}));

const { getRequestMock, getResponseMock } = require('../../utils');
const { postConfirmServiceConfig } = require('../../../src/app/services/confirmServiceConfig');
const { getServiceById, updateService } = require('../../../src/infrastructure/applications');
const { getUserServiceRoles } = require('../../../src/app/services/utils');
const logger = require('../../../src/infrastructure/logger');
const { REDIRECT_URLS_CHANGES, ERROR_MESSAGES } = require('../../../src/constants/serviceConfigConstants');
const {
  retreiveRedirectUrlsFromStorage,
  deleteFromLocalStorage,
} = require('../../../src/infrastructure/utils/serviceConfigCache');

const res = getResponseMock();

const currentServiceInfo = {
  id: 'service1',
  name: 'service one',
  description: 'service description',

  relyingParty: {
    token_endpoint_auth_method: null,
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
    response_types: ['code', 'id_token'],
  },
};

describe('when confirming service config changes in the review page', () => {
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
    getServiceById.mockReturnValue(currentServiceInfo);
    getUserServiceRoles.mockReset();
    getUserServiceRoles.mockImplementation(() => Promise.resolve([]));

    res.mockResetAll();

    retreiveRedirectUrlsFromStorage.mockReset();

    req.session.serviceConfigurationChanges = {
      authFlowType: 'authorisationCodeFlow',
      serviceHome: {
        newValue: 'https://new-service-home.com',
        oldValue: 'http://old-service-home.com',
      },
      postResetUrl: { oldValue: 'https://www.postreset.com', newValue: 'https://new-post-reset-url' },

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
  it('then it should redirect to service configuration page if there are no changes stored in session', async () => {
    req.session.serviceConfigurationChanges = undefined;
    await postConfirmServiceConfig(req, res);

    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith('/services/service1/service-configuration');
  });

  it('then it should render view with validation if service home not a valid url', async () => {
    req.session.serviceConfigurationChanges.serviceHome.newValue = ['invalid-url'];

    await postConfirmServiceConfig(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/confirmServiceConfig');
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        serviceHome: `${ERROR_MESSAGES.INVALID_HOME_URL}`,
      },
    }));
  });

  it('then it should render view with validation if Post-reset Url is not valid', async () => {
    req.session.serviceConfigurationChanges.postResetUrl.newValue = 'invalid-url';

    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        postResetUrl: `${ERROR_MESSAGES.INVALID_POST_PASSWORD_RESET_URL}`,
      },
    }));
  });

  it('then it should render view with validation if any of the redirect Urls are invalid', async () => {
    retreiveRedirectUrlsFromStorage.mockReturnValue({
      redirectUris: {
        oldValue: ['https://www.redirect.com'],
        newValue: ['https://valid-url.com', 'invalid-url'],
      },
    });

    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        redirect_uris: `${ERROR_MESSAGES.INVALID_REDIRECT_URL}`,
      },
    }));
  });

  it('then it should render view with validation if redirect Urls are not unique', async () => {
    retreiveRedirectUrlsFromStorage.mockReturnValue({
      redirectUris: {
        oldValue: ['https://www.redirect.com'],
        newValue: ['https://valid-url.com', 'https://valid-url.com'],
      },
    });

    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        redirect_uris: `${ERROR_MESSAGES.REDIRECT_URLS_NOT_UNIQUE}`,
      },
    }));
  });

  it('then it should render view with validation if logout redirect Urls are not unique', async () => {
    retreiveRedirectUrlsFromStorage.mockReturnValue({
      postLogoutRedirectUris: {
        oldValue: ['https://www.redirect.com'],
        newValue: ['https://duplicate-url.com', 'https://duplicate-url.com'],
      },
    });

    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        post_logout_redirect_uris: `${ERROR_MESSAGES.POST_LOGOUT_URL_NOT_UNIQUE}`,
      },
    }));
  });

  it('then it should render view with validation if any of the logout redirect Urls are invalid', async () => {
    retreiveRedirectUrlsFromStorage.mockReturnValue({
      postLogoutRedirectUris: {
        oldValue: ['https://www.redirect.com'],
        newValue: ['https://valid-url.com', 'invalid'],
      },
    });

    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        post_logout_redirect_uris: `${ERROR_MESSAGES.INVALID_POST_LOGOUT_URL}`,
      },
    }));
  });

  it('then it should render view with validation if client secret is invalid', async () => {
    req.session.serviceConfigurationChanges.clientSecret.secretNewValue = 'invalid-secret';

    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        clientSecret: `${ERROR_MESSAGES.INVALID_CLIENT_SECRET}`,
      },
    }));
  });

  it('then it should render view with validation if API secret is invalid', async () => {
    req.session.serviceConfigurationChanges.apiSecret.secretNewValue = 'invalid-secret';

    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        apiSecret: `${ERROR_MESSAGES.INVALID_API_SECRET}`,
      },
    }));
  });

  it('then it should update the service if no errors are displayed', async () => {
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
    await postConfirmServiceConfig(req, res);
    expect(updateService.mock.calls).toHaveLength(1);
    expect(updateService.mock.calls[0][0]).toBe('service1');
    expect(updateService.mock.calls[0][1]).toEqual(
      {
        apiSecret: 'outshine-wringing-imparting-submitted',
        clientSecret: 'outshine-wringing-imparting-submitted',
        grant_types: [
          'authorisation_code',
          'refresh_token',
        ],
        postResetUrl: 'https://new-post-reset-url',
        post_logout_redirect_uris: [
          'http://new-logout-url-1.com',
          'http://new-logout-url-2.com',
        ],
        redirect_uris: [
          'https://www.new-redirect.com',
        ],
        response_types: [
          'id_token',
          'token',
        ],
        serviceHome: 'https://new-service-home.com',
        tokenEndpointAuthMethod: 'client_secret_post',
      },
    );
    expect(updateService.mock.calls[0][2]).toBe('correlationId');
  });

  it('then it should audit the service being edited and it should return a mix of explicit/expunged elements in the audit editedFields array, if a mix of secret/non-secret fields have been updated', async () => {
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
    await postConfirmServiceConfig(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe('user@unit.test (id: user1) updated service configuration for service service one (id: service1)');
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      editedFields: [
        {
          name: 'serviceHome',
          newValue: 'https://new-service-home.com',
          oldValue: 'http://old-service-home.com',
        },
        {
          name: 'postResetUrl',
          newValue: 'https://new-post-reset-url',
          oldValue: 'https://www.postreset.com',
        },
        {
          name: 'responseTypes',
          newValue: [
            'id_token',
            'token',
          ],
          oldValue: [
            'code',
            'id_token',
          ],
        },
        {
          name: 'grantTypes',
          newValue: [
            'authorisation_code',
            'refresh_token',
          ],
          oldValue: [
            'implicit',
            'authorization_code',
          ],
        },
        {
          name: 'apiSecret',
          newValue: 'EXPUNGED',
          oldValue: 'EXPUNGED',
        },
        {
          name: 'clientSecret',
          newValue: 'EXPUNGED',
          oldValue: 'EXPUNGED',
        },
        {
          name: 'tokenEndpointAuthMethod',
          newValue: 'client_secret_post',
          oldValue: null,
        },
        {
          name: 'redirectUris',
          newValue: [
            'https://www.new-redirect.com',
          ],
          oldValue: [
            'https://www.redirect.com',
          ],
        },
        {
          name: 'postLogoutRedirectUris',
          newValue: [
            'http://new-logout-url-1.com',
            'http://new-logout-url-2.com',
          ],
          oldValue: [
            'http://old-logout-url-1.com',
          ],
        },
      ],
      editedService: 'service1',
      subType: 'service-config-updated',
      type: 'manage',
      userEmail: 'user@unit.test',
      userId: 'user1',
    });
  });

  it('then it should return multiple elements in the audit editedFields array, if multiple non-secret fields have been updated', async () => {
    req.session.serviceConfigurationChanges = {
      postResetUrl: { oldValue: 'https://www.postreset.com', newValue: 'https://new-post-reset-url' },
      serviceHome: {
        oldValue: 'http://old-service-home.com',
        newValue: 'http://new-service-home.com',
      },
    };

    await postConfirmServiceConfig(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][1]).toHaveProperty('editedFields', [{
      name: 'postResetUrl',
      newValue: 'https://new-post-reset-url',
      oldValue: 'https://www.postreset.com',
    },
    {
      name: 'serviceHome',
      newValue: 'http://new-service-home.com',
      oldValue: 'http://old-service-home.com',
    },
    ]);
  });

  it('should then remove the redirect urls stored in app cache', async () => {
    await postConfirmServiceConfig(req, res);

    expect(deleteFromLocalStorage).toHaveBeenCalledTimes(1);
    expect(deleteFromLocalStorage.mock.calls[0][0]).toBe(`${REDIRECT_URLS_CHANGES}_${req.session.passport.user.sub}_${req.params.sid}`);
  });

  it('should redirect to Dashboard page and display success banner if service successfuly updated', async () => {
    await postConfirmServiceConfig(req, res);

    expect(res.flash.mock.calls).toHaveLength(3);
    expect(res.flash.mock.calls[0][0]).toBe('title');
    expect(res.flash.mock.calls[0][1]).toBe('Success');
    expect(res.flash.mock.calls[1][0]).toBe('heading');
    expect(res.flash.mock.calls[1][1]).toBe('Service configuration changed');
    expect(res.flash.mock.calls[2][0]).toBe('message');
    expect(res.flash.mock.calls[2][1]).toBe('Your changes to service configuration for service one have been saved.');
    expect(res.redirect).toHaveBeenCalledWith('/services/service1');
  });
});
