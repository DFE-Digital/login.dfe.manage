const mockUtils = require("../../utils");

jest.mock("login.dfe.validation");
jest.mock("./../../../src/infrastructure/config", () =>
  mockUtils.configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  mockUtils.loggerMockFactory(),
);
jest.mock("./../../../src/infrastructure/applications");

jest.mock("../../../src/app/services/utils", () => {
  const actualUtilsFunctions = jest.requireActual(
    "../../../src/app/services/utils",
  );
  return {
    ...actualUtilsFunctions,
    processRedirectUris: jest.fn(actualUtilsFunctions.processRedirectUris),
    determineAuthFlowByRespType: jest.fn(
      actualUtilsFunctions.determineAuthFlowByRespType,
    ),
    getUserServiceRoles: jest.fn(actualUtilsFunctions.getUserServiceRoles),
    processConfigurationTypes: jest.fn(
      actualUtilsFunctions.processConfigurationTypes,
    ),
    isValidUrl: jest.fn(actualUtilsFunctions.isValidUrl),
    isCorrectLength: jest.fn(actualUtilsFunctions.isCorrectLength),
    isCorrectProtocol: jest.fn(actualUtilsFunctions.isCorrectProtocol),
    checkClientId: jest.fn(),
  };
});

const { getRequestMock, getResponseMock } = require("../../utils");
const {
  postConfirmServiceConfig,
} = require("../../../src/app/services/confirmServiceConfig");
const {
  getServiceById,
  updateService,
} = require("../../../src/infrastructure/applications");
const {
  getUserServiceRoles,
  checkClientId,
} = require("../../../src/app/services/utils");
const logger = require("../../../src/infrastructure/logger");
const {
  ERROR_MESSAGES,
} = require("../../../src/constants/serviceConfigConstants");

const res = getResponseMock();

const currentServiceInfo = {
  id: "service1",
  name: "service one",
  description: "service description",

  relyingParty: {
    token_endpoint_auth_method: null,
    client_id: "clientid",
    client_secret: "dewier-thrombi-confounder-mikado",
    api_secret: "dewier-thrombi-confounder-mikado",
    service_home: "http://old-service-home.com",
    postResetUrl: "https://www.postreset.com",
    redirect_uris: ["https://www.redirect.com"],
    post_logout_redirect_uris: ["http://old-logout-url-1.com"],
    grant_types: ["implicit", "authorization_code"],
    response_types: ["code", "id_token"],
  },
};

describe("when confirming service config changes in the review page", () => {
  let req;

  beforeEach(() => {
    jest.clearAllMocks();
    req = getRequestMock({
      params: {
        sid: "service1",
      },
      userServices: {
        roles: [
          {
            code: "serviceid_serviceconfiguration",
          },
        ],
      },
      query: {},
      session: {
        passport: {
          user: {
            sub: "user_id_uuid",
          },
        },
      },
    });

    getUserServiceRoles.mockReset();
    getUserServiceRoles.mockImplementation(() => Promise.resolve([]));
    getUserServiceRoles.mockReset();
    getUserServiceRoles.mockImplementation(() => Promise.resolve([]));
    checkClientId.mockReset();

    updateService.mockReset();
    getServiceById.mockReset();
    getServiceById
      .mockReturnValueOnce({ ...currentServiceInfo })
      .mockReturnValueOnce(null);

    res.mockResetAll();

    req.session.serviceConfigurationChanges = {
      authFlowType: "authorisationCodeFlow",
      serviceHome: {
        newValue: "https://newservicehome.com",
        oldValue: "http://old-service-home.com",
      },
      postResetUrl: {
        oldValue: "https://www.postreset.com",
        newValue: "https://newpostreseturl",
      },

      responseTypes: {
        oldValue: ["code", "id_token"],
        newValue: ["token", "id_token"],
      },
      grantTypes: {
        newValue: ["authorisation_code", "refresh_token"],
        oldValue: ["implicit", "authorization_code"],
        serviceHome: {
          oldValue: "http://old-service-home.com",
          newValue: "http://new-service-home.com",
        },
      },
      apiSecret: {
        oldValue: "EXPUNGED",
        newValue: "EXPUNGED",
        secretNewValue: "outshine-wringing-imparting-submitted",
      },
      clientSecret: {
        oldValue: "EXPUNGED",
        newValue: "EXPUNGED",
        secretNewValue: "outshine-wringing-imparting-submitted",
      },
      tokenEndpointAuthMethod: {
        oldValue: null,
        newValue: "client_secret_post",
      },
      clientId: {
        newValue: "new-client-id",
        oldValue: "clientid",
      },
    };
  });
  it("then it should redirect to service configuration page if there are no changes stored in session", async () => {
    req.session.serviceConfigurationChanges = undefined;
    await postConfirmServiceConfig(req, res);

    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith(
      "/services/service1/service-configuration",
    );
  });

  it("then it should render view with validation if service home not a valid url", async () => {
    req.session.serviceConfigurationChanges.serviceHome.newValue =
      "invalid-url";
    req.session.serviceConfigurationChanges.redirectUris = {};
    req.session.serviceConfigurationChanges.redirectUris.oldValue = [
      "https://google.com",
      "https://yahoo.com",
    ];
    req.session.serviceConfigurationChanges.postLogoutRedirectUris = {};
    req.session.serviceConfigurationChanges.postLogoutRedirectUris.oldValue = [
      "https://google.com",
      "https://yahoo.com",
    ];

    await postConfirmServiceConfig(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe(
      "services/views/confirmServiceConfig",
    );
    expect(res.render.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        validationMessages: {
          // postResetUrl: `${ERROR_MESSAGES.INVALID_RESETPASS_PROTOCOL}`,
          // post_logout_redirect_uris: `${ERROR_MESSAGES.MISSING_POST_LOGOUT_URL}`,
          // redirect_uris: `${ERROR_MESSAGES.MISSING_REDIRECT_URL}`,
          serviceHome: `${ERROR_MESSAGES.INVALID_HOME_PROTOCOL}`,
        },
      }),
    );
  });

  it("then it should render view with validation if Post-reset Url is not valid", async () => {
    req.session.serviceConfigurationChanges.postResetUrl.newValue =
      "invalid-url";
    req.session.serviceConfigurationChanges.redirectUris = {};
    req.session.serviceConfigurationChanges.redirectUris.oldValue = [
      "https://google.com",
      "https://yahoo.com",
    ];
    req.session.serviceConfigurationChanges.postLogoutRedirectUris = {};
    req.session.serviceConfigurationChanges.postLogoutRedirectUris.oldValue = [
      "https://google.com",
      "https://yahoo.com",
    ];
    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        validationMessages: {
          postResetUrl: `${ERROR_MESSAGES.INVALID_POST_PASSWORD_RESET_URL}`,
          postResetUrl: `${ERROR_MESSAGES.INVALID_RESETPASS_PROTOCOL}`,
          // post_logout_redirect_uris: `${ERROR_MESSAGES.MISSING_POST_LOGOUT_URL}`,
          // redirect_uris: `${ERROR_MESSAGES.MISSING_REDIRECT_URL}`,
        },
      }),
    );
  });

  it("then it should render view with validation if client ID is too long", async () => {
    req.session.serviceConfigurationChanges.clientId.newValue =
      "long-client-id-long-client-id-long-client-id-long-client-id-long-client-id-long-client-id-long-client-id";
    req.session.serviceConfigurationChanges.redirectUris = {};
    req.session.serviceConfigurationChanges.redirectUris.oldValue = [
      "https://google.com",
      "https://yahoo.com",
    ];
    req.session.serviceConfigurationChanges.postLogoutRedirectUris = {};
    req.session.serviceConfigurationChanges.postLogoutRedirectUris.oldValue = [
      "https://google.com",
      "https://yahoo.com",
    ];
    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        validationMessages: {
          clientId: `${ERROR_MESSAGES.INVALID_CLIENT_ID_LENGTH}`,
          // redirect_uris: `${ERROR_MESSAGES.REDIRECT_URLS_NOT_UNIQUE}`,
          // postResetUrl: `${ERROR_MESSAGES.INVALID_RESETPASS_PROTOCOL}`,
          // post_logout_redirect_uris: `${ERROR_MESSAGES.POST_LOGOUT_URL_NOT_UNIQUE}`,
          //
          // post_logout_redirect_uris: `${ERROR_MESSAGES.MISSING_POST_LOGOUT_URL}`,
          // redirect_uris: `${ERROR_MESSAGES.MISSING_REDIRECT_URL}`,
        },
      }),
    );
  });

  it("then it should render view with validation if client ID is not containing only letters a to z, hyphens and numbers", async () => {
    req.session.serviceConfigurationChanges.clientId.newValue = "client-id_1_$";
    req.session.serviceConfigurationChanges.redirectUris = {};
    req.session.serviceConfigurationChanges.redirectUris.oldValue = [
      "https://google.com",
      "https://yahoo.com",
    ];
    req.session.serviceConfigurationChanges.postLogoutRedirectUris = {};
    req.session.serviceConfigurationChanges.postLogoutRedirectUris.oldValue = [
      "https://google.com",
      "https://yahoo.com",
    ];
    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        validationMessages: {
          clientId: `${ERROR_MESSAGES.INVALID_CLIENT_ID}`,
        },
      }),
    );
  });

  it("then it should render view with validation if client ID already exists", async () => {
    req.session.serviceConfigurationChanges.clientId.newValue = "client-id-new";
    req.session.serviceConfigurationChanges.redirectUris = {};
    req.session.serviceConfigurationChanges.redirectUris.oldValue = [
      "https://google.com",
      "https://yahoo.com",
    ];
    req.session.serviceConfigurationChanges.postLogoutRedirectUris = {};
    req.session.serviceConfigurationChanges.postLogoutRedirectUris.oldValue = [
      "https://google.com",
      "https://yahoo.com",
    ];
    checkClientId.mockReset().mockReturnValueOnce(true);
    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        validationMessages: {
          clientId: `${ERROR_MESSAGES.CLIENT_ID_UNAVAILABLE}`,
        },
      }),
    );
  });

  it("then it should render view without validation if client ID is present, only contain letters a to z, hyphens and numbers,is 50 characters or less and is unique ", async () => {
    req.session.serviceConfigurationChanges.clientId.newValue = "client-id-new";
    checkClientId.mockReset().mockReturnValueOnce(false);
    req.session.serviceConfigurationChanges.redirectUris = {};
    req.session.serviceConfigurationChanges.redirectUris.oldValue = [
      "https://google.com",
      "https://yahoo.com",
    ];
    req.session.serviceConfigurationChanges.postLogoutRedirectUris = {};
    req.session.serviceConfigurationChanges.postLogoutRedirectUris.oldValue = [
      "https://google.com",
      "https://yahoo.com",
    ];

    await postConfirmServiceConfig(req, res);
    expect(res.redirect.mock.calls).toHaveLength(1);
  });

  it("then it should render view with validation if any of the redirect Urls are invalid", async () => {
    req.session.serviceConfigurationChanges.redirectUris = {
      oldValue: ["https://www.redirect.com"],
      newValue: ["https://valid-url.com", "invalid-url"],
    };
    req.session.serviceConfigurationChanges.postLogoutRedirectUris = {};
    req.session.serviceConfigurationChanges.postLogoutRedirectUris.oldValue = [
      "https://google.com",
      "https://yahoo.com",
    ];

    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        validationMessages: {
          redirect_uris: `${ERROR_MESSAGES.INVALID_REDIRECT_PROTOCOL}`,
        },
      }),
    );
  });

  it("then it should render view with validation if redirect Urls are not unique", async () => {
    req.session.serviceConfigurationChanges.redirectUris = {
      oldValue: ["https://www.redirect.com"],
      newValue: ["https://valid-url.com", "https://valid-url.com"],
    };
    req.session.serviceConfigurationChanges.postLogoutRedirectUris = {};
    req.session.serviceConfigurationChanges.postLogoutRedirectUris.oldValue = [
      "https://google.com",
      "https://yahoo.com",
    ];
    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        validationMessages: {
          redirect_uris: `${ERROR_MESSAGES.REDIRECT_URLS_NOT_UNIQUE}`,
        },
      }),
    );
  });

  it("then it should render view with validation if logout redirect Urls are not unique", async () => {
    req.session.serviceConfigurationChanges.postLogoutRedirectUris = {
      oldValue: ["https://www.redirect.com"],
      newValue: ["https://duplicate-url.com", "https://duplicate-url.com"],
    };
    req.session.serviceConfigurationChanges.redirectUris = {};
    req.session.serviceConfigurationChanges.redirectUris.oldValue = [
      "https://google.com",
      "https://yahoo.com",
    ];

    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        validationMessages: {
          // redirect_uris: `${ERROR_MESSAGES.MISSING_REDIRECT_URL}`,
          // post_logout_redirect_uris: `${ERROR_MESSAGES.MISSING_POST_LOGOUT_URL}`,
          post_logout_redirect_uris: `${ERROR_MESSAGES.POST_LOGOUT_URL_NOT_UNIQUE}`,
          // postResetUrl: `${ERROR_MESSAGES.INVALID_RESETPASS_PROTOCOL}`,
        },
      }),
    );
  });

  it("then it should render view with validation if any of the logout redirect Urls are invalid", async () => {
    req.session.serviceConfigurationChanges.postLogoutRedirectUris = {
      oldValue: ["https://www.redirect.com"],
      newValue: ["https://valid-url.com", "invalid"],
    };
    req.session.serviceConfigurationChanges.redirectUris = {};
    req.session.serviceConfigurationChanges.redirectUris.oldValue = [
      "https://google.com",
      "https://yahoo.com",
    ];

    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        validationMessages: {
          post_logout_redirect_uris: `${ERROR_MESSAGES.INVALID_LOGOUT_REDIRECT_PROTOCOL}`,
        },
      }),
    );
  });

  it("then it should render view with validation if client secret is invalid", async () => {
    req.session.serviceConfigurationChanges.clientSecret.secretNewValue =
      "invalid-secret";
    req.session.serviceConfigurationChanges.redirectUris = {};
    req.session.serviceConfigurationChanges.redirectUris.oldValue = [
      "https://google.com",
      "https://yahoo.com",
    ];
    req.session.serviceConfigurationChanges.postLogoutRedirectUris = {};
    req.session.serviceConfigurationChanges.postLogoutRedirectUris.oldValue = [
      "https://google.com",
      "https://yahoo.com",
    ];
    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        validationMessages: {
          clientSecret: `${ERROR_MESSAGES.INVALID_CLIENT_SECRET}`,
        },
      }),
    );
  });

  it("then it should render view with validation if API secret is invalid", async () => {
    req.session.serviceConfigurationChanges.apiSecret.secretNewValue =
      "invalid-secret";
    req.session.serviceConfigurationChanges.redirectUris = {};
    req.session.serviceConfigurationChanges.redirectUris.oldValue = [
      "https://google.com",
      "https://yahoo.com",
    ];
    req.session.serviceConfigurationChanges.postLogoutRedirectUris = {};
    req.session.serviceConfigurationChanges.postLogoutRedirectUris.oldValue = [
      "https://google.com",
      "https://yahoo.com",
    ];

    await postConfirmServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        validationMessages: {
          apiSecret: `${ERROR_MESSAGES.INVALID_API_SECRET}`,
        },
      }),
    );
  });

  it("then it should update the service if no errors are displayed", async () => {
    req.session.serviceConfigurationChanges = {
      authFlowType: "authorisationCodeFlow",
      serviceHome: {
        newValue: "https://newservicehome.com",
        oldValue: "http://old-service-home.com",
      },
      redirectUris: {
        oldValue: ["https://www.redirect.com"],
        newValue: ["https://www.redirected.com"],
      },
      postLogoutRedirectUris: {
        oldValue: ["http://oldlogouturl1.com"],
        newValue: ["http://newlogouturl1.com", "http://newlogouturl2.com"],
      },
      postResetUrl: {
        oldValue: "https://www.postreset.com",
        newValue: "https://newpostreseturl.com",
      },
      responseTypes: {
        oldValue: ["code", "id_token"],
        newValue: ["token", "id_token"],
      },
      grantTypes: {
        newValue: ["authorisation_code", "refresh_token"],
        oldValue: ["implicit", "authorization_code"],
        serviceHome: {
          oldValue: "http://old-service-home.com",
          newValue: "http://new-service-home.com",
        },
      },
      apiSecret: {
        oldValue: "EXPUNGED",
        newValue: "EXPUNGED",
        secretNewValue: "outshine-wringing-imparting-submitted",
      },
      clientSecret: {
        oldValue: "EXPUNGED",
        newValue: "EXPUNGED",
        secretNewValue: "outshine-wringing-imparting-submitted",
      },
      tokenEndpointAuthMethod: {
        oldValue: null,
        newValue: "client_secret_post",
      },
      clientId: {
        newValue: "new-client-id",
        oldValue: "clientid",
      },
    };

    await postConfirmServiceConfig(req, res);

    expect(updateService.mock.calls).toHaveLength(1);
    expect(updateService.mock.calls[0][0]).toBe("service1");
    expect(updateService.mock.calls[0][1]).toEqual({
      apiSecret: "outshine-wringing-imparting-submitted",
      clientId: "new-client-id",
      clientSecret: "outshine-wringing-imparting-submitted",
      grant_types: ["authorisation_code", "refresh_token"],
      postResetUrl: "https://newpostreseturl.com",
      post_logout_redirect_uris: [
        "http://newlogouturl1.com",
        "http://newlogouturl2.com",
      ],
      redirect_uris: ["https://www.redirected.com"],
      response_types: ["id_token", "token"],
      serviceHome: "https://newservicehome.com",
      tokenEndpointAuthMethod: "client_secret_post",
    });
    expect(updateService.mock.calls[0][2]).toBe("correlationId");
  });

  it("then it should audit the service being edited and it should return a mix of explicit/expunged elements in the audit editedFields array, if a mix of secret/non-secret fields have been updated", async () => {
    req.session.serviceConfigurationChanges = {
      authFlowType: "authorisationCodeFlow",
      serviceHome: {
        newValue: "https://newservicehome.com",
        oldValue: "http://old-service-home.com",
      },
      redirectUris: {
        oldValue: ["https://www.redirect.com"],
        newValue: ["https://www.newredirect.com"],
      },
      postLogoutRedirectUris: {
        oldValue: ["http://old-logout-url-1.com"],
        newValue: ["http://newlogouturl-1.com", "http://newlogouturl-2.com"],
      },
      postResetUrl: {
        oldValue: "https://www.postreset.com",
        newValue: "https://newpostreseturl.com",
      },
      responseTypes: {
        oldValue: ["code", "id_token"],
        newValue: ["token", "id_token"],
      },
      grantTypes: {
        newValue: ["authorisation_code", "refresh_token"],
        oldValue: ["implicit", "authorization_code"],
        serviceHome: {
          oldValue: "http://old-service-home.com",
          newValue: "http://new-service-home.com",
        },
      },
      apiSecret: {
        oldValue: "EXPUNGED",
        newValue: "EXPUNGED",
        secretNewValue: "outshine-wringing-imparting-submitted",
      },
      clientSecret: {
        oldValue: "EXPUNGED",
        newValue: "EXPUNGED",
        secretNewValue: "outshine-wringing-imparting-submitted",
      },
      tokenEndpointAuthMethod: {
        oldValue: null,
        newValue: "client_secret_post",
      },
      clientId: {
        newValue: "new-client-id",
        oldValue: "clientid",
      },
    };
    await postConfirmServiceConfig(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe(
      "user@unit.test (id: user1) updated service configuration for service service one (id: service1)",
    );
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      editedFields: expect.arrayContaining([
        {
          name: "serviceHome",
          newValue: "https://newservicehome.com",
          oldValue: "http://old-service-home.com",
        },
        {
          name: "postResetUrl",
          newValue: "https://newpostreseturl.com",
          oldValue: "https://www.postreset.com",
        },
        {
          name: "responseTypes",
          newValue: ["id_token", "token"],
          oldValue: ["code", "id_token"],
        },
        {
          name: "grantTypes",
          newValue: ["authorisation_code", "refresh_token"],
          oldValue: ["implicit", "authorization_code"],
        },
        {
          name: "apiSecret",
          newValue: "EXPUNGED",
          oldValue: "EXPUNGED",
        },
        {
          name: "clientSecret",
          newValue: "EXPUNGED",
          oldValue: "EXPUNGED",
        },
        {
          name: "tokenEndpointAuthMethod",
          newValue: "client_secret_post",
          oldValue: null,
        },
        {
          name: "redirectUris",
          newValue: ["https://www.newredirect.com"],
          oldValue: ["https://www.redirect.com"],
        },
        {
          name: "postLogoutRedirectUris",
          newValue: ["http://newlogouturl-1.com", "http://newlogouturl-2.com"],
          oldValue: ["http://old-logout-url-1.com"],
        },
        {
          name: "clientId",
          newValue: "new-client-id",
          oldValue: "clientid",
        },
      ]),
      editedService: "service1",
      subType: "service-config-updated",
      type: "manage",
      userEmail: "user@unit.test",
      userId: "user1",
    });
  });

  it("then it should return multiple elements in the audit editedFields array, if multiple non-secret fields have been updated", async () => {
    req.session.serviceConfigurationChanges = {
      postResetUrl: {
        oldValue: "https://www.postreset.com",
        newValue: "https://newpostreseturl.com",
      },
      serviceHome: {
        oldValue: "http://old-service-home.com",
        newValue: "http://new-service-home.com",
      },
    };
    req.session.serviceConfigurationChanges = {
      authFlowType: "authorisationCodeFlow",
      serviceHome: {
        newValue: "https://newservicehome.com",
        oldValue: "http://old-service-home.com",
      },
      redirectUris: {
        oldValue: "https://www.postredirect.com",
        newValue: "https://newpostredirect.com",
      },
      postResetUrl: {
        oldValue: "https://www.postreset.com",
        newValue: "https://newpostreseturl.com",
      },
      postLogoutRedirectUris: {
        oldValue: "https://www.postlogoutreset.com",
        newValue: "https://newpostlogoutreseturl.com",
      },
      responseTypes: {
        oldValue: ["code", "id_token"],
        newValue: ["token", "id_token"],
      },
      grantTypes: {
        newValue: ["authorisation_code", "refresh_token"],
        oldValue: ["implicit", "authorization_code"],
        serviceHome: {
          oldValue: "http://old-service-home.com",
          newValue: "http://new-service-home.com",
        },
      },
      apiSecret: {
        oldValue: "EXPUNGED",
        newValue: "EXPUNGED",
        secretNewValue: "outshine-wringing-imparting-submitted",
      },
      clientSecret: {
        oldValue: "EXPUNGED",
        newValue: "EXPUNGED",
        secretNewValue: "outshine-wringing-imparting-submitted",
      },
      tokenEndpointAuthMethod: {
        oldValue: null,
        newValue: "client_secret_post",
      },
      clientId: {
        newValue: "new-client-id",
        oldValue: "clientid",
      },
    };

    await postConfirmServiceConfig(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    /* expect(logger.audit.mock.calls[0][1]).toHaveProperty('editedFields', [{
      name: 'postResetUrl',
      newValue: 'https://newpostreseturl.com',
      oldValue: 'https://www.postreset.com',
    },
    {
      name: 'postLogoutRedirectUris',
      newValue: 'https://newpostlogoutreseturl.com',
      oldValue: 'https://www.postlogoutreset.com',
    },
    ]); */
  });

  it("should redirect to Dashboard page and display success banner if service successfuly updated", async () => {
    req.session.serviceConfigurationChanges = {
      authFlowType: "authorisationCodeFlow",
      serviceHome: {
        newValue: "https://newservicehome.com",
        oldValue: "http://old-service-home.com",
      },
      redirectUris: {
        oldValue: "https://www.postredirect.com",
        newValue: "https://newpostredirect.com",
      },
      postResetUrl: {
        oldValue: "https://www.postreset.com",
        newValue: "https://newpostreseturl.com",
      },
      postLogoutRedirectUris: {
        oldValue: "https://www.postlogoutreset.com",
        newValue: "https://newpostlogoutreseturl.com",
      },
      responseTypes: {
        oldValue: ["code", "id_token"],
        newValue: ["token", "id_token"],
      },
      grantTypes: {
        newValue: ["authorisation_code", "refresh_token"],
        oldValue: ["implicit", "authorization_code"],
        serviceHome: {
          oldValue: "http://old-service-home.com",
          newValue: "http://new-service-home.com",
        },
      },
      apiSecret: {
        oldValue: "EXPUNGED",
        newValue: "EXPUNGED",
        secretNewValue: "outshine-wringing-imparting-submitted",
      },
      clientSecret: {
        oldValue: "EXPUNGED",
        newValue: "EXPUNGED",
        secretNewValue: "outshine-wringing-imparting-submitted",
      },
      tokenEndpointAuthMethod: {
        oldValue: null,
        newValue: "client_secret_post",
      },
      clientId: {
        newValue: "new-client-id",
        oldValue: "clientid",
      },
    };
    await postConfirmServiceConfig(req, res);

    expect(res.flash.mock.calls).toHaveLength(3);
    expect(res.flash.mock.calls[0][0]).toBe("title");
    expect(res.flash.mock.calls[0][1]).toBe("Success");
    expect(res.flash.mock.calls[1][0]).toBe("heading");
    expect(res.flash.mock.calls[1][1]).toBe("Service configuration changed");
    expect(res.flash.mock.calls[2][0]).toBe("message");
    expect(res.flash.mock.calls[2][1]).toBe(
      "Your changes to service configuration for service one have been saved.",
    );
    expect(res.redirect).toHaveBeenCalledWith("/services/service1");
  });
});
