const mockUtils = require('../../utils');

jest.mock('./../../../src/infrastructure/config', () => mockUtils.configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => mockUtils.loggerMockFactory());
jest.mock('./../../../src/infrastructure/applications');
jest.mock('../../../src/app/services/utils');

const { getRequestMock, getResponseMock } = require('../../utils');
const { postServiceConfig } = require('../../../src/app/services/serviceConfig');
const { getServiceById, updateService } = require('../../../src/infrastructure/applications');
const { getUserServiceRoles } = require('../../../src/app/services/utils');

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

// Represents the request body and the updateService info.
const requestServiceInfo = {
  description: 'service description',
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
  name: currentServiceInfo.name || '',
  clientId: currentServiceInfo.relyingParty.client_id || '',
  description: currentServiceInfo.description,
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

describe('when editing the service configuration', () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      body: { ...requestServiceInfo },
      params: {
        sid: 'service1',
      },
      query: {},

    });

    getUserServiceRoles.mockReset();
    getUserServiceRoles.mockImplementation(() => Promise.resolve([]));

    updateService.mockReset();
    getServiceById.mockReset();
    getServiceById.mockReturnValueOnce({ ...currentServiceInfo }).mockReturnValueOnce(null);
    res.mockResetAll();
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

  it('then it should render view with validation if redirect urls are not unique', async () => {
    req.body.redirect_uris = [
      'https://www.redirect-url.com',
      'https://www.redirect-url.com',
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

  it('then it should render view with validation if Post-reset Url is not valid', async () => {
    req.body.postResetUrl = 'invalid-url';

    await postServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        postResetUrl: 'Please enter a valid Post-reset Url',
      },
    }));
  });

  it('then it should render view with validation if no redirect Urls are specified', async () => {
    req.body.redirect_uris = [];

    await postServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        redirect_uris: 'At least one redirect Url must be specified',
      },
    }));
  });

  it('then it should render view with validation if any of the redirect Urls are invalid', async () => {
    req.body.redirect_uris = ['https://valid-url.com', 'invalid-url'];

    await postServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        redirect_uris: 'Invalid redirect Url',
      },
    }));
  });

  it('then it should render view with validation if redirect Urls are not unique', async () => {
    req.body.redirect_uris = ['https://valid-url.com', 'https://valid-url.com'];

    await postServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        redirect_uris: 'Redirect Urls must be unique',
      },
    }));
  });

  it('then it should render view with validation if logout redirect Urls are not unique', async () => {
    req.body.post_logout_redirect_uris = ['https://duplicate-url.com', 'https://duplicate-url.com'];

    await postServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        post_logout_redirect_uris: 'Logout redirect Urls must be unique',
      },
    }));
  });

  it('then it should render view with validation if any of the logout redirect Urls are invalid', async () => {
    req.body.post_logout_redirect_uris = ['https://valid-url.com', 'invalid'];

    await postServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        post_logout_redirect_uris: 'Invalid logout redirect Url',
      },
    }));
  });

  it('then it should render view with validation if no logout redirect Urls are specified', async () => {
    req.body.post_logout_redirect_uris = [];

    await postServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        post_logout_redirect_uris: 'At least one logout redirect Url must be specified',
      },
    }));
  });

  it('then it should render view with validation if client secret is invalid', async () => {
    req.body.clientSecret = 'invalid-secret';

    await postServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        clientSecret: 'Invalid client secret',
      },
    }));
  });

  it('then it should render view with validation if API secret is invalid', async () => {
    req.body.apiSecret = 'invalid-secret';

    await postServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        apiSecret: 'Invalid api secret',
      },
    }));
  });

  it('should redirect to Review service configuration changes when no validation messages and Continue button is pressed', async () => {
    await postServiceConfig(req, res);

    expect(res.redirect).toHaveBeenCalledWith('review-service-configuration#');
  });
});
