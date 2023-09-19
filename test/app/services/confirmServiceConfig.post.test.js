const mockUtils = require('../../utils');

jest.mock('./../../../src/infrastructure/config', () => mockUtils.configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => mockUtils.loggerMockFactory());
jest.mock('./../../../src/infrastructure/applications');
jest.mock('../../../src/app/services/utils');

const { getRequestMock, getResponseMock } = require('../../utils');
const { postConfirmServiceConfig } = require('../../../src/app/services/confirmServiceConfig');
const { getServiceById, updateService } = require('../../../src/infrastructure/applications');
const { getUserServiceRoles } = require('../../../src/app/services/utils');
const logger = require('../../../src/infrastructure/logger');

const res = getResponseMock();

const currentServiceInfo = {
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
    });

    getServiceById.mockReset();
    getServiceById.mockReturnValue(currentServiceInfo);
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
        secretNewValue: 'outshine-wringing-imparting-submitted',
      },
      clientSecret: {
        oldValue: 'EXPUNGED',
        newValue: 'EXPUNGED',
        secretNewValue: 'outshine-wringing-imparting-submitted',
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
        serviceHome: 'Please enter a valid home Url',
      },
    }));
  });

  it('then it should render view with validation if Post-reset Url is not valid', async () => {
    req.session.serviceConfigurationChanges.postResetUrl.newValue = 'invalid-url';

    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        postResetUrl: 'Please enter a valid Post-reset Url',
      },
    }));
  });

  it('then it should render view with validation if any of the redirect Urls are invalid', async () => {
    req.session.serviceConfigurationChanges.redirectUris.newValue = ['https://valid-url.com', 'invalid-url'];

    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        redirect_uris: 'Invalid redirect Url',
      },
    }));
  });

  it('then it should render view with validation if redirect Urls are not unique', async () => {
    req.session.serviceConfigurationChanges.redirectUris.newValue = ['https://valid-url.com', 'https://valid-url.com'];

    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        redirect_uris: 'Redirect Urls must be unique',
      },
    }));
  });

  it('then it should render view with validation if logout redirect Urls are not unique', async () => {
    req.session.serviceConfigurationChanges.postLogoutRedirectUris.newValue = ['https://duplicate-url.com', 'https://duplicate-url.com'];

    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        post_logout_redirect_uris: 'Logout redirect Urls must be unique',
      },
    }));
  });

  it('then it should render view with validation if any of the logout redirect Urls are invalid', async () => {
    req.session.serviceConfigurationChanges.postLogoutRedirectUris.newValue = ['https://valid-url.com', 'invalid'];

    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        post_logout_redirect_uris: 'Invalid logout redirect Url',
      },
    }));
  });

  it('then it should render view with validation if client secret is invalid', async () => {
    req.session.serviceConfigurationChanges.clientSecret.secretNewValue = 'invalid-secret';

    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        clientSecret: 'Invalid client secret',
      },
    }));
  });

  it('then it should render view with validation if API secret is invalid', async () => {
    req.session.serviceConfigurationChanges.apiSecret.secretNewValue = 'invalid-secret';

    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        apiSecret: 'Invalid api secret',
      },
    }));
  });

  it('then it should update the service if no errors are displayed', async () => {
    await postConfirmServiceConfig(req, res);
    expect(updateService.mock.calls).toHaveLength(1);
    expect(updateService.mock.calls[0][0]).toBe('service1');
    expect(updateService.mock.calls[0][1]).toEqual(
      {
        apiSecret: 'outshine-wringing-imparting-submitted',
        clientSecret: 'outshine-wringing-imparting-submitted',
        grant_types: undefined,
        postResetUrl: 'https://new-post-reset-url',
        post_logout_redirect_uris: ['http://new-logout-url-1.com', 'http://new-logout-url-2.com'],
        redirect_uris: ['https://www.new-redirect.com'],
        response_types: ['response-type-2', 'response-type-3'],
        serviceHome: 'http://new-service-home.com',
        tokenEndpointAuthMethod: null,
      },
    );
    expect(updateService.mock.calls[0][2]).toBe('correlationId');
  });

  it('then it should audit the service being edited and it should return a mix of explicit/expunged elements in the audit editedFields array, if a mix of secret/non-secret fields have been updated', async () => {
    await postConfirmServiceConfig(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe('user@unit.test (id: user1) updated service configuration for service service one (id: service1)');
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: 'manage',
      subType: 'service-config-updated',
      userId: 'user1',
      userEmail: 'user@unit.test',
      editedService: 'service1',
      editedFields: [
        {
          name: 'postResetUrl',
          newValue: 'https://new-post-reset-url',
          oldValue: 'https://www.postreset.com',
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
        {
          name: 'responseTypes',
          newValue: [
            'response-type-2',
            'response-type-3',
          ],
          oldValue: [
            'response-type-1',
            'response-type-2',
            'response-type-3',
          ],
        },
        {
          name: 'serviceHome',
          newValue: 'http://new-service-home.com',
          oldValue: 'http://old-service-home.com',
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
      ],
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
