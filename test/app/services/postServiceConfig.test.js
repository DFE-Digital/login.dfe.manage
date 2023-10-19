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
  retreiveRedirectUrls: jest.fn(),
  deleteRedirectUrlsFromCache: jest.fn(),
  saveRedirectUrls: jest.fn(),
}));

const { getRequestMock, getResponseMock } = require('../../utils');
const { postServiceConfig } = require('../../../src/app/services/serviceConfig');
const { getServiceById, updateService } = require('../../../src/infrastructure/applications');
const { getUserServiceRoles } = require('../../../src/app/services/utils');
const { saveRedirectUrls } = require('../../../src/infrastructure/utils/serviceConfigCache');
const { REDIRECT_URLS_CHANGES } = require('../../../src/constants/serviceConfigConstants');

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
    'authorization_code',
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
  refreshToken: null,
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
      authFlowType: 'hybridFlow',
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
        serviceHome: 'Please enter a valid home URL',
      },
    });
  });

  it('then it should render view without validation if service home url is an empty string', async () => {
    req.body.serviceHome = '';

    await postServiceConfig(req, res);
    expect(res.render.mock.calls).toHaveLength(0);
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
      authFlowType: 'hybridFlow',
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
        redirect_uris: 'Redirect URLs must be unique',
      },
    });
  });

  it('then it should render view with validation if Post-reset Url is not valid URL', async () => {
    req.body.postResetUrl = 'invalid-url';

    await postServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        postResetUrl: 'Please enter a valid post password-reset URL',
      },
    }));
  });

  it('then it should render view without validation if Post-reset Url is an empty string', async () => {
    req.body.postResetUrl = '';

    await postServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(0);
  });

  it('then it should render view with validation if no redirect Urls are specified', async () => {
    req.body.redirect_uris = [];

    await postServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        redirect_uris: 'At least one redirect URL must be specified',
      },
    }));
  });

  it('then it should render view with validation if any of the redirect Urls are invalid', async () => {
    req.body.redirect_uris = ['https://valid-url.com', 'invalid-url'];

    await postServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        redirect_uris: 'Invalid redirect URL',
      },
    }));
  });

  it('then it should render view with validation if redirect Urls are not unique', async () => {
    req.body.redirect_uris = ['https://valid-url.com', 'https://valid-url.com'];

    await postServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        redirect_uris: 'Redirect URLs must be unique',
      },
    }));
  });

  it('then it should render view with validation if logout redirect Urls are not unique', async () => {
    req.body.post_logout_redirect_uris = ['https://duplicate-url.com', 'https://duplicate-url.com'];

    await postServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        post_logout_redirect_uris: 'Logout redirect URLs must be unique',
      },
    }));
  });

  it('then it should render view with validation if any of the logout redirect Urls are invalid', async () => {
    req.body.post_logout_redirect_uris = ['https://valid-url.com', 'invalid'];

    await postServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        post_logout_redirect_uris: 'Invalid logout redirect URL',
      },
    }));
  });

  it('then it should render view with validation if no logout redirect Urls are specified', async () => {
    req.body.post_logout_redirect_uris = [];

    await postServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        post_logout_redirect_uris: 'At least one logout redirect URL must be specified',
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
        apiSecret: 'Invalid API secret',
      },
    }));
  });

  it('then it should render view with validation if no response type is selected', async () => {
    req.body.response_types = [];

    await postServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        responseTypes: 'Select at least 1 response type',
      },
    }));
  });

  it('then it should render view with validation if response type is undefined', async () => {
    req.body.response_types = undefined;

    await postServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        responseTypes: 'Select at least 1 response type',
      },
    }));
  });

  it('then it should render view with validation when "token" is the sole response_type selected', async () => {
    req.body.response_types = ['token'];

    await postServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
      validationMessages: {
        responseTypes: "You must select more than 1 response type when selecting 'token' as a response type",
      },
    }));
  });

  it('then it should set the grantTypes to "authorization_code" when the selected response type is "code" - corresponding to the "Authorisation Code" flow', async () => {
    req.body.response_types = ['code'];

    await postServiceConfig(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual('authorisationCodeFlow');
    expect(req.session.serviceConfigurationChanges.grantTypes).toEqual({
      newValue: [
        'authorization_code',
      ],
      oldValue: [
        'implicit',
        'authorization_code',
      ],
    });
  });

  it('then it should set the grantTypes to "authorization_code" when the selected response type is "code & id_token" - corresponding to the "Hybrid" flow', async () => {
    req.body.response_types = ['code', 'id_token'];

    await postServiceConfig(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual('hybridFlow');
    expect(req.session.serviceConfigurationChanges.grantTypes).toEqual({
      newValue: [
        'authorization_code',
      ],
      oldValue: [
        'implicit',
        'authorization_code',
      ],
    });
  });

  it('then it should set the grantTypes to "authorization_code" when the selected response type is "code & id_token & token" - corresponding to the "Hybrid" flow', async () => {
    req.body.response_types = ['code', 'id_token', 'token'];

    await postServiceConfig(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual('hybridFlow');
    expect(req.session.serviceConfigurationChanges.grantTypes).toEqual({
      newValue: [
        'authorization_code',
      ],
      oldValue: [
        'implicit',
        'authorization_code',
      ],
    });
  });

  it('then it should set the grantTypes to "authorization_code" when the selected response type is "code & token" - corresponding to the "Hybrid" flow', async () => {
    req.body.response_types = ['code', 'token'];

    await postServiceConfig(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual('hybridFlow');
    expect(req.session.serviceConfigurationChanges.grantTypes).toEqual({
      newValue: [
        'authorization_code',
      ],
      oldValue: [
        'implicit',
        'authorization_code',
      ],
    });
  });

  it('then it should set the grantTypes to "implicit" when the selected response type is "id_token" - corresponding to the "Implicit" flow', async () => {
    req.body.response_types = ['id_token'];

    await postServiceConfig(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual('implicitFlow');
    expect(req.session.serviceConfigurationChanges.grantTypes).toEqual({
      newValue: [
        'implicit',
      ],
      oldValue: [
        'implicit',
        'authorization_code',
      ],
    });
  });

  it('then it should set the grantTypes to "implicit" when the selected response type is "id_token & token" - corresponding to the "Implicit" flow', async () => {
    req.body.response_types = ['id_token', 'token'];

    await postServiceConfig(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual('implicitFlow');
    expect(req.session.serviceConfigurationChanges.grantTypes).toEqual({
      newValue: [
        'implicit',
      ],
      oldValue: [
        'implicit',
        'authorization_code',
      ],
    });
  });

  it('then it should include "refresh_token" in grantTypes when the "refresh_token" is selected and the chosen response type corresponds to the "Authorisation Code" flow.', async () => {
    req.body.response_types = ['code'];
    req.body.refresh_token = 'refresh_token';

    await postServiceConfig(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual('authorisationCodeFlow');
    expect(req.session.serviceConfigurationChanges.grantTypes).toEqual({
      newValue: [
        'authorization_code',
        'refresh_token',
      ],
      oldValue: [
        'authorization_code',
        'implicit',
      ],
    });
  });

  it('then it should not include "refresh_token" in grantTypes when the "refresh_token" is not selected and the chosen response type corresponds to the "Authorisation Code" flow.', async () => {
    req.body.response_types = ['code'];
    req.body.refresh_token = undefined;

    await postServiceConfig(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual('authorisationCodeFlow');
    expect(req.session.serviceConfigurationChanges.grantTypes).toEqual({
      newValue: [
        'authorization_code',
      ],
      oldValue: [
        'authorization_code',
        'implicit',
      ],
    });
  });

  it('then it should include "refresh_token" in grantTypes when the "refresh_token" is selected and the chosen response type corresponds to the "Hybrid" flow.', async () => {
    req.body.response_types = ['code', 'id_token'];
    req.body.refresh_token = 'refresh_token';

    await postServiceConfig(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual('hybridFlow');
    expect(req.session.serviceConfigurationChanges.grantTypes).toEqual({
      newValue: [
        'authorization_code',
        'refresh_token',
      ],
      oldValue: [
        'authorization_code',
        'implicit',
      ],
    });
  });

  it('then it should not include "refresh_token" in grantTypes when the "refresh_token" is not selected and the chosen response type corresponds to the "Authorisation Code" flow.', async () => {
    req.body.response_types = ['code', 'id_token'];
    req.body.refresh_token = undefined;

    await postServiceConfig(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual('hybridFlow');
    expect(req.session.serviceConfigurationChanges.grantTypes).toEqual({
      newValue: [
        'authorization_code',
      ],
      oldValue: [
        'authorization_code',
        'implicit',
      ],
    });
  });

  it('then it should not include "refresh_token" in grantTypes when the "refresh_token" is selected and the chosen response type corresponds to the "Implicit" flow.', async () => {
    req.body.response_types = ['token', 'id_token'];
    req.body.refresh_token = 'refresh_token';

    await postServiceConfig(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual('implicitFlow');
    expect(req.session.serviceConfigurationChanges.grantTypes).toEqual({
      newValue: [
        'implicit',
      ],
      oldValue: [
        'authorization_code',
        'implicit',
      ],
    });
  });

  it('then it should not update "tokenEndpointAuthMethod" when the tokenEndpointAuthMethod is selected and the chosen response type corresponds to the "Implicit" flow.', async () => {
    req.body.response_types = ['token', 'id_token'];

    await postServiceConfig(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual('implicitFlow');
    expect(req.session.serviceConfigurationChanges.tokenEndpointAuthMethod).toBe(undefined);
  });

  it('then it should update "tokenEndpointAuthMethod" when the tokenEndpointAuthMethod is selected and the chosen response type corresponds to the "Authorisation Code" flow.', async () => {
    req.body.response_types = ['code'];

    await postServiceConfig(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual('authorisationCodeFlow');
    expect(req.session.serviceConfigurationChanges.tokenEndpointAuthMethod).toEqual(
      { newValue: 'client_secret_post', oldValue: 'client_secret_basic' },
    );
  });

  it('then it should not update "tokenEndpointAuthMethod" when the tokenEndpointAuthMethod is not selected and the chosen response type corresponds to the "Authorisation Code" flow.', async () => {
    req.body.response_types = ['code'];
    req.body.tokenEndpointAuthMethod = undefined;

    await postServiceConfig(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual('authorisationCodeFlow');
    expect(req.session.serviceConfigurationChanges.tokenEndpointAuthMethod).toBe(undefined);
  });

  it('then it should not update "tokenEndpointAuthMethod" when the tokenEndpointAuthMethod is not selected and the chosen response type corresponds to the "Hybrid" flow.', async () => {
    req.body.response_types = ['code', 'id_token'];
    req.body.tokenEndpointAuthMethod = undefined;

    await postServiceConfig(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual('hybridFlow');
    expect(req.session.serviceConfigurationChanges.tokenEndpointAuthMethod).toBe(undefined);
  });

  it('then it should update "tokenEndpointAuthMethod" when the tokenEndpointAuthMethod is selected and the chosen response type corresponds to the "Hybrid" flow.', async () => {
    req.body.response_types = ['code', 'token'];

    await postServiceConfig(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual('hybridFlow');
    expect(req.session.serviceConfigurationChanges.tokenEndpointAuthMethod).toEqual(
      { newValue: 'client_secret_post', oldValue: 'client_secret_basic' },
    );
  });

  it('should save the redirect and postRedirect urls into the app cache memory', async () => {
    req.body.redirect_uris = ['https://www.new-redirect.com'];
    req.body.post_logout_redirect_uris = ['http://new-logout-url-1.com', 'http://new-logout-url-2.com'];

    await postServiceConfig(req, res);

    expect(saveRedirectUrls).toHaveBeenCalledTimes(1);
    expect(saveRedirectUrls.mock.calls[0][0]).toBe(REDIRECT_URLS_CHANGES);
    expect(saveRedirectUrls.mock.calls[0][1]).toEqual({
      postLogoutRedirectUris: {
        newValue: ['http://new-logout-url-1.com', 'http://new-logout-url-2.com'],
        oldValue: ['https://www.logout.com'],
      },
      redirectUris: {
        newValue: ['https://www.new-redirect.com'],
        oldValue: ['https://www.redirect.com'],
      },
    });
  });

  it('should redirect to Review service configuration changes when no validation messages and Continue button is pressed', async () => {
    await postServiceConfig(req, res);

    expect(res.redirect).toHaveBeenCalledWith('review-service-configuration#');
  });
});
