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

jest.mock("login.dfe.validation", () => ({
  urlValidator: jest.fn(),
}));

jest.mock("login.dfe.api-client/api/setup");
jest.mock("login.dfe.api-client/services", () => ({
  getServiceRaw: jest.fn(),
}));

const { getRequestMock, getResponseMock } = require("../../utils");
const { getServiceRaw } = require("login.dfe.api-client/services");
const {
  postServiceConfig,
} = require("../../../src/app/services/serviceConfig");
const { updateService } = require("../../../src/infrastructure/applications");
const {
  getUserServiceRoles,
  checkClientId,
} = require("../../../src/app/services/utils");
const {
  ERROR_MESSAGES,
} = require("../../../src/constants/serviceConfigConstants");

const res = getResponseMock();

// Represents the getServiceRaw response.
const currentAuthServiceInfo = {
  id: "service1",
  name: "service one",
  description: "service description",
  relyingParty: {
    client_id: "clientid",
    client_secret: "dewier-thrombi-confounder-mikado",
    service_home: "https://www.servicehome.com",
    postResetUrl: "https://www.postreset.com",
    redirect_uris: ["https://www.redirect.com"],
    post_logout_redirect_uris: ["https://www.logout.com"],
    grant_types: ["authorization_code", "implicit"],
    response_types: ["code", "token"],
    api_secret: "dewier-thrombi-confounder-mikado",
    token_endpoint_auth_method: undefined,
  },
};

// Represents the request body and the updateService info for the auth code flow.
const requestAuthCodeServiceInfo = {
  clientSecret: "outshine-wringing-imparting-submitted",
  clientId: "new-client-id",
  serviceHome: "https://www.servicehome2.com",
  postResetUrl: "https://www.postreset2.com",
  redirect_uris: ["https://www.redirect.com", "https://www.redirect2.com"],
  post_logout_redirect_uris: ["https://www.logout2.com"],
  grant_types: ["authorization_code"],
  response_types: ["code"],
  apiSecret: "outshine-wringing-imparting-submitted",
  tokenEndpointAuthMethod: "client_secret_post",
};

// Represents the request body and the updateService info for the hybrid flow.
const currentHybridServiceInfo = {
  id: "service1",
  name: "service one",
  description: "service description",
  relyingParty: {
    client_id: "clientid",
    client_secret: "dewier-thrombi-confounder-mikado",
    service_home: "https://www.servicehome.com",
    postResetUrl: "https://www.postreset.com",
    redirect_uris: ["https://www.redirect.com"],
    post_logout_redirect_uris: ["https://www.logout.com"],
    grant_types: ["authorization_code"],
    response_types: ["code"],
    api_secret: "dewier-thrombi-confounder-mikado",
    token_endpoint_auth_method: undefined,
  },
};

const requestHybridServiceInfo = {
  clientSecret: "outshine-wringing-imparting-submitted",
  clientId: "new-client-id",
  serviceHome: "https://www.servicehome2.com",
  postResetUrl: "https://www.postreset2.com",
  redirect_uris: ["https://www.redirect.com", "https://www.redirect2.com"],
  post_logout_redirect_uris: ["https://www.logout2.com"],
  grant_types: ["authorization_code", "implicit"],
  response_types: [],
  apiSecret: "outshine-wringing-imparting-submitted",
  tokenEndpointAuthMethod: "client_secret_post",
};

const currentImplicitServiceInfo = {
  id: "service1",
  name: "service one",
  description: "service description",
  relyingParty: {
    client_id: "clientid",
    client_secret: "dewier-thrombi-confounder-mikado",
    service_home: "https://www.servicehome.com",
    postResetUrl: "https://www.postreset.com",
    redirect_uris: ["https://www.redirect.com"],
    post_logout_redirect_uris: ["https://www.logout.com"],
    grant_types: ["authorization_code"],
    response_types: ["code"],
    api_secret: "dewier-thrombi-confounder-mikado",
    token_endpoint_auth_method: undefined,
  },
};

const requestImplicitServiceInfo = {
  clientSecret: "outshine-wringing-imparting-submitted",
  clientId: "new-client-id",
  serviceHome: "https://www.servicehome2.com",
  postResetUrl: "https://www.postreset2.com",
  redirect_uris: ["https://www.redirect.com", "https://www.redirect2.com"],
  post_logout_redirect_uris: ["https://www.logout2.com"],
  grant_types: ["implicit"],
  response_types: [],
  apiSecret: "outshine-wringing-imparting-submitted",
  tokenEndpointAuthMethod: "client_secret_post",
};

// | Selection # | Code | ID_Token | Token | Flow Type |
// |-------------|------|----------|-------|-----------|
// | 1           | X    |          |       | Auth      |
// | 2           | X    |          | X     | Hybrid    |
// | 3           | X    | X        |       | Hybrid    |
// | 4           | X    | X        | X     | Hybrid    |
// | 5           |      | X        |       | Implicit  |
// | 6           |      | X        | X     | Implicit  |

// AUTH FLOW / General Bound Checks
describe("when editing the AUTH flow service configuration", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      body: { ...requestAuthCodeServiceInfo },
      params: {
        sid: "service1",
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
    checkClientId.mockReset();

    updateService.mockReset();
    updateService.mockImplementation(() => Promise.resolve([]));
    getServiceRaw.mockReset();
    getServiceRaw
      .mockReturnValueOnce({ ...currentAuthServiceInfo })
      .mockReturnValueOnce(null);
    res.mockResetAll();
  });

  // COMMON Tests
  it("then it should render view without validation if service home url is an empty string", async () => {
    // ARRANGE
    req.body.serviceHome = "";

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.render.mock.calls).toHaveLength(0);
  });

  it("then it should render view with validation if Post-reset Url is not valid URL", async () => {
    // ARRANGE
    req.body.postResetUrl = "invalid-url";

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        validationMessages: {
          postResetUrl: `${ERROR_MESSAGES.INVALID_RESETPASS_PROTOCOL}`,
        },
      }),
    );
  });

  it("then it should render view with validation if client ID is not present", async () => {
    // ARRANGE
    req.body.clientId = "";

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        validationMessages: {
          clientId: `${ERROR_MESSAGES.MISSING_CLIENT_ID}`,
        },
      }),
    );
  });

  it("then it should render view with validation if client ID is too long", async () => {
    // ARRANGE
    req.body.clientId =
      "long-client-id-long-client-id-long-client-id-long-client-id-long-client-id-long-client-id-long-client-id";

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        validationMessages: {
          clientId: `${ERROR_MESSAGES.INVALID_CLIENT_ID_LENGTH}`,
        },
      }),
    );
  });

  it("then it should render view with validation if client ID is not containing only letters a to z, hyphens and numbers", async () => {
    // ARRANGE
    req.body.clientId = "client-id_1_$";

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
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
    // ARRANGE
    req.body.clientId = "client-id-new";
    checkClientId.mockReset().mockReturnValueOnce(true);

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
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
    // ARRANGE
    req.body.clientId = "client-id-new";
    checkClientId.mockReset().mockReturnValueOnce(false);

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.render.mock.calls).toHaveLength(0);
  });

  it("then it should render view without validation if Post-reset Url is an empty string", async () => {
    // ARRANGE
    req.body.postResetUrl = "";

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    /// this must return nothing inorder to fix an error in another journey in reset password
    expect(res.render.mock.calls).toHaveLength(0);
  });

  it("then it should render view with validation if no redirect Urls are specified", async () => {
    // ARRANGE
    req.body.redirect_uris = [];

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        validationMessages: {
          redirect_uris: `${ERROR_MESSAGES.MISSING_REDIRECT_URL}`,
        },
      }),
    );
  });

  it("then it should render view with validation if any of the redirect Urls are invalid", async () => {
    // ARRANGE
    req.body.redirect_uris = ["https://valid-url.com", "invalid-url"];

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
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
    // ARRANGE
    req.body.redirect_uris = ["https://valid-url.com", "https://valid-url.com"];

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
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
    // ARRANGE
    req.body.post_logout_redirect_uris = [
      "https://duplicate-url.com",
      "https://duplicate-url.com",
    ];

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        validationMessages: {
          post_logout_redirect_uris: `${ERROR_MESSAGES.POST_LOGOUT_URL_NOT_UNIQUE}`,
        },
      }),
    );
  });

  it("then it should render view with validation if any of the logout redirect Urls are invalid", async () => {
    // ARRANGE
    req.body.post_logout_redirect_uris = ["https://valid-url.com", "invalid"];

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        validationMessages: {
          post_logout_redirect_uris: `${ERROR_MESSAGES.INVALID_LOGOUT_REDIRECT_PROTOCOL}`,
        },
      }),
    );
  });

  it("then it should render view with validation if no logout redirect Urls are specified", async () => {
    // ARRANGE
    req.body.post_logout_redirect_uris = [];

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        validationMessages: {
          post_logout_redirect_uris: `${ERROR_MESSAGES.MISSING_POST_LOGOUT_URL}`,
        },
      }),
    );
  });

  it("then it should render view with validation if client secret is invalid", async () => {
    // ARRANGE
    req.body.clientSecret = "invalid-secret";

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
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
    // ARRANGE
    req.body.apiSecret = "invalid-secret";

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        validationMessages: {
          apiSecret: `${ERROR_MESSAGES.INVALID_API_SECRET}`,
        },
      }),
    );
  });

  it("then it should render view with validation if no response type is selected", async () => {
    // ARRANGE
    req.body.response_types = [];

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        validationMessages: {
          responseTypes: `${ERROR_MESSAGES.MISSING_RESPONSE_TYPE}`,
        },
      }),
    );
  });

  it("then it should render view with validation if response type is undefined", async () => {
    // ARRANGE
    req.body.response_types = undefined;

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        validationMessages: {
          responseTypes: `${ERROR_MESSAGES.MISSING_RESPONSE_TYPE}`,
        },
      }),
    );
  });

  // AUTH Flow
  it('then it should set the grantTypes to "authorization_code" when the selected response type is "code" - corresponding to the "Authorisation Code" flow', async () => {
    // ARRANGE

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual(
      "authorisationCodeFlow",
    );

    // Move this out to its own test for verifying what has been changed
    expect(req.session.serviceConfigurationChanges.grantTypes).toEqual({
      newValue: ["authorization_code"],
      oldValue: ["authorization_code", "implicit"],
    });
  });

  it('then it should include "refresh_token" in grantTypes when the "refresh_token" is selected and the chosen response type corresponds to the "Authorisation Code" flow.', async () => {
    // ARRANGE
    req.body.refresh_token = "refresh_token";

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual(
      "authorisationCodeFlow",
    );
    expect(req.session.serviceConfigurationChanges.grantTypes).toEqual({
      newValue: ["authorization_code", "refresh_token"],
      oldValue: ["authorization_code", "implicit"],
    });
  });

  it('then it should not include "refresh_token" in grantTypes when the "refresh_token" is not selected and the chosen response type corresponds to the "Authorisation Code" flow.', async () => {
    // ARRANGE
    req.body.refresh_token = undefined;

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual(
      "authorisationCodeFlow",
    );
    expect(req.session.serviceConfigurationChanges.grantTypes).toEqual({
      newValue: ["authorization_code"],
      oldValue: ["authorization_code", "implicit"],
    });
  });

  it('then it should update "tokenEndpointAuthMethod" when the tokenEndpointAuthMethod is selected and the chosen response type corresponds to the "Authorisation Code" flow.', async () => {
    // ARRANGE

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual(
      "authorisationCodeFlow",
    );
    expect(
      req.session.serviceConfigurationChanges.tokenEndpointAuthMethod,
    ).toEqual({
      newValue: "client_secret_post",
      oldValue: "client_secret_basic",
    });
  });

  it('then it should not update "tokenEndpointAuthMethod" when the tokenEndpointAuthMethod is not selected and the chosen response type corresponds to the "Authorisation Code" flow.', async () => {
    // ARRANGE
    req.body.tokenEndpointAuthMethod = undefined;

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual(
      "authorisationCodeFlow",
    );
    expect(
      req.session.serviceConfigurationChanges.tokenEndpointAuthMethod,
    ).toBe(undefined);
  });

  it('then it should not update "tokenEndpointAuthMethod" when the tokenEndpointAuthMethod is not selected and the chosen response type corresponds to the "Hybrid" flow.', async () => {
    // ARRANGE
    req.body.response_types.push("id_token");
    req.body.tokenEndpointAuthMethod = undefined;

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual(
      "hybridFlow",
    );
    expect(
      req.session.serviceConfigurationChanges.tokenEndpointAuthMethod,
    ).toBe(undefined);
  });

  it('then it should update "tokenEndpointAuthMethod" when the tokenEndpointAuthMethod is selected and the chosen response type corresponds to the "Hybrid" flow.', async () => {
    // ARRANGE
    req.body.response_types.push("token");

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual(
      "hybridFlow",
    );
    expect(
      req.session.serviceConfigurationChanges.tokenEndpointAuthMethod,
    ).toEqual({
      newValue: "client_secret_post",
      oldValue: "client_secret_basic",
    });
  });

  it("should redirect to Review service configuration changes when no validation messages and Continue button is pressed", async () => {
    // ARRANGE

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.redirect).toHaveBeenCalledWith("review-service-configuration#");
  });
});

// HYBRID FLOW
describe("when editing the HYBRID flow service configuration", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      body: { ...requestHybridServiceInfo },
      params: {
        sid: "service1",
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
    checkClientId.mockReset();

    updateService.mockReset();
    updateService.mockImplementation(() => Promise.resolve([]));
    getServiceRaw.mockReset();
    getServiceRaw
      .mockReturnValueOnce({ ...currentHybridServiceInfo })
      .mockReturnValueOnce(null);
    res.mockResetAll();
  });

  it("then it should render view with validation if service home not a valid url", async () => {
    // ARRANGE
    req.body.serviceHome = "not-a-url";
    req.body.response_types = ["code", "token"];

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/serviceConfig");
    expect(res.render.mock.calls[0][1].validationMessages).toEqual({
      serviceHome: `${ERROR_MESSAGES.INVALID_HOME_PROTOCOL}`,
    });
  });

  it("then it should render view with validation if redirect urls are not unique", async () => {
    // ARRANGE
    req.body.redirect_uris = [
      "https://www.redirect-url.com",
      "https://www.redirect-url.com",
    ];
    req.body.response_types = ["code", "token"];

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/serviceConfig");
    expect(res.render.mock.calls[0][1].validationMessages).toEqual({
      redirect_uris: `${ERROR_MESSAGES.REDIRECT_URLS_NOT_UNIQUE}`,
    });
  });

  it('then it should set the grantTypes to "authorization_code", "implicit" when the selected response type is "code & id_token" - corresponding to the "Hybrid" flow', async () => {
    // ARRANGE
    // req.body.response_types.push("id_token");
    req.body.response_types = ["code", "id_token"];

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual(
      "hybridFlow",
    );
    expect(req.session.serviceConfigurationChanges.grantTypes).toEqual({
      newValue: ["authorization_code", "implicit"],
      oldValue: ["authorization_code"],
    });
  });

  it('then it should set the grantTypes to "authorization_code", "implicit" when the selected response type is "code & id_token & token" - corresponding to the "Hybrid" flow', async () => {
    // ARRANGE
    req.body.response_types = ["code", "token", "id_token"];

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual(
      "hybridFlow",
    );
    expect(req.session.serviceConfigurationChanges.grantTypes).toEqual({
      newValue: ["authorization_code", "implicit"],
      oldValue: ["authorization_code"],
    });
  });

  it('then it should set the grantTypes to "authorization_code", "implicit" when the selected response type is "code and token" - corresponding to the "Hybrid" flow', async () => {
    // ARRANGE
    req.body.response_types = ["code", "token"];

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual(
      "hybridFlow",
    );
    expect(req.session.serviceConfigurationChanges.grantTypes).toEqual({
      newValue: ["authorization_code", "implicit"],
      oldValue: ["authorization_code"],
    });
  });

  it('then it should NOT include "refresh_token" in grantTypes when the "refresh_token" is NOT selected and the chosen response type corresponds to the "Hybrid" flow.', async () => {
    // ARRANGE
    req.body.response_types = ["code", "id_token"];
    req.body.refresh_token = undefined;

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual(
      "hybridFlow",
    );
    expect(req.session.serviceConfigurationChanges.grantTypes).toEqual({
      newValue: ["authorization_code", "implicit"],
      oldValue: ["authorization_code"],
    });
    expect(req.session.serviceConfigurationChanges.refreshToken).toBe(
      undefined,
    );
  });

  it('then it should include "refresh_token" in grantTypes when the "refresh_token" is selected and the chosen response type corresponds to the "Hybrid" flow.', async () => {
    // ARRANGE
    req.body.response_types = ["code", "id_token"];
    req.body.refresh_token = "refresh_token";

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual(
      "hybridFlow",
    );
    expect(req.session.serviceConfigurationChanges.grantTypes).toEqual({
      newValue: ["authorization_code", "implicit", "refresh_token"],
      oldValue: ["authorization_code"],
    });
  });
});

// | Selection # | Code | ID_Token | Token | Flow Type |
// |-------------|------|----------|-------|-----------|
// | 1           | X    |          |       | Auth      |
// | 2           | X    |          | X     | Hybrid    |
// | 3           | X    | X        |       | Hybrid    |
// | 4           | X    | X        | X     | Hybrid    |
// | 5           |      | X        |       | Implicit  |
// | 6           |      | X        | X     | Implicit  |

// IMPLICIT FLOW
describe("when editing the IMPLICIT flow service configuration", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      body: { ...requestImplicitServiceInfo },
      params: {
        sid: "service1",
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
    checkClientId.mockReset();

    updateService.mockReset();
    updateService.mockImplementation(() => Promise.resolve([]));
    getServiceRaw.mockReset();
    getServiceRaw
      .mockReturnValueOnce({ ...currentImplicitServiceInfo })
      .mockReturnValueOnce(null);
    res.mockResetAll();
  });

  it('then it should render view with validation when "token" is the sole response_type selected', async () => {
    // ARRANGE
    req.body.response_types = ["token"];

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        validationMessages: {
          responseTypes: `${ERROR_MESSAGES.RESPONSE_TYPE_TOKEN_ERROR}`,
        },
      }),
    );
  });

  it('then it should set the grantTypes to "implicit" when the selected response type is "id_token" - corresponding to the "Implicit" flow', async () => {
    // ARRANGE
    req.body.response_types = ["id_token"];

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual(
      "implicitFlow",
    );
    expect(req.session.serviceConfigurationChanges.grantTypes).toEqual({
      newValue: ["implicit"],
      oldValue: ["authorization_code"],
    });
  });

  it('then it should set the grantTypes to "implicit" when the selected response type is "id_token and token" - corresponding to the "Implicit" flow', async () => {
    // ARRANGE
    req.body.response_types = ["id_token", "token"];

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual(
      "implicitFlow",
    );
    expect(req.session.serviceConfigurationChanges.grantTypes).toEqual({
      newValue: ["implicit"],
      oldValue: ["authorization_code"],
    });
  });

  it('then it should not include "refresh_token" in grantTypes when the "refresh_token" is selected and the chosen response type corresponds to the "Implicit" flow.', async () => {
    // ARRANGE
    req.body.response_types = ["token", "id_token"];
    req.body.refresh_token = "refresh_token";

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual(
      "implicitFlow",
    );
    expect(req.session.serviceConfigurationChanges.grantTypes).toEqual({
      newValue: ["implicit"],
      oldValue: ["authorization_code"],
    });
  });

  it('then it should not update "tokenEndpointAuthMethod" when the tokenEndpointAuthMethod is selected and the chosen response type corresponds to the "Implicit" flow.', async () => {
    // ARRANGE
    req.body.response_types = ["token", "id_token"];

    // ACT
    await postServiceConfig(req, res);

    // ASSERT
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(req.session.serviceConfigurationChanges.authFlowType).toEqual(
      "implicitFlow",
    );
    expect(
      req.session.serviceConfigurationChanges.tokenEndpointAuthMethod,
    ).toBe(undefined);
  });
});
