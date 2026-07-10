const mockUtils = require("../../utils");

jest.mock("./../../../src/infrastructure/config", () =>
  mockUtils.configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  mockUtils.loggerMockFactory(),
);
jest.mock("login.dfe.validation");
jest.mock("login.dfe.api-client/encryption", () => ({
  encrypt: jest.fn((text) => text),
  decrypt: jest.fn((text) => text),
}));
jest.mock("login.dfe.api-client/services", () => ({
  getServiceRaw: jest.fn(),
  updateService: jest.fn(),
}));
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

const { getGrantTypes } = require("./../../../src/app/services/serviceConfig");

describe("when determining the grant types to set", () => {
  it("should return authorization code grant type with refresh token for hybrid or authorization code flow", () => {
    const result = getGrantTypes({
      isHybridFlow: true,
      isAuthorisationCodeFlow: false,
      isImplicitFlow: false,
      refreshToken: "refresh_token",
      oldService: null,
    });
    expect(result).toEqual(["authorization_code", "implicit", "refresh_token"]);
  });
  it("should return authorization code grant type without refresh token for hybrid or authorization code flow", () => {
    const result = getGrantTypes({
      isHybridFlow: true,
      isAuthorisationCodeFlow: false,
      isImplicitFlow: false,
      refreshToken: null,
      oldService: null,
    });
    expect(result).toEqual(["authorization_code", "implicit"]);
  });
  it("should return implicit grant type for implicit flow", () => {
    const result = getGrantTypes({
      isHybridFlow: false,
      isAuthorisationCodeFlow: false,
      isImplicitFlow: true,
      refreshToken: null,
      oldService: null,
    });
    expect(result).toEqual(["implicit"]);
  });
  it("should return authorisation grant type for authorisation flow", () => {
    const result = getGrantTypes({
      isHybridFlow: false,
      isAuthorisationCodeFlow: true,
      isImplicitFlow: false,
      refreshToken: null,
      oldService: null,
    });
    expect(result).toEqual(["authorization_code"]);
  });
  it("should return old service grant types if no flow conditions are met", () => {
    const oldService = { grantTypes: ["some_grant_type"] };
    const result = getGrantTypes({
      isHybridFlow: false,
      isAuthorisationCodeFlow: false,
      isImplicitFlow: false,
      refreshToken: null,
      oldService,
    });
    expect(result).toEqual(["some_grant_type"]);
  });
  it("should return an empty array if no flow conditions are met and oldService is undefined", () => {
    const result = getGrantTypes({
      isHybridFlow: false,
      isAuthorisationCodeFlow: false,
      isImplicitFlow: false,
      refreshToken: null,
      oldService: undefined,
    });
    expect(result).toEqual([]);
  });
});

const {
  SERVICE_CONFIG_CHANGES_SUMMARY_DETAILS,
} = require("./../../../src/constants/serviceConfigConstants");

describe("SERVICE_CONFIG_CHANGES_SUMMARY_DETAILS", () => {
  it("contains an isServiceHidden entry", () => {
    expect(
      SERVICE_CONFIG_CHANGES_SUMMARY_DETAILS.isServiceHidden,
    ).toBeDefined();
  });

  it("isServiceHidden has displayOrder 0 so it renders first on the review page", () => {
    expect(
      SERVICE_CONFIG_CHANGES_SUMMARY_DETAILS.isServiceHidden.displayOrder,
    ).toBe(0);
  });

  it("isServiceHidden changeLink points to its form group anchor", () => {
    expect(
      SERVICE_CONFIG_CHANGES_SUMMARY_DETAILS.isServiceHidden.changeLink,
    ).toContain("#isServiceHidden-form-group");
  });
});

const {
  isServiceHiddenFromDb,
} = require("./../../../src/app/services/serviceConfig");

describe("isServiceHiddenFromDb", () => {
  it("returns true for an id-only service with all four flags set to truthy strings", () => {
    expect(
      isServiceHiddenFromDb({
        isIdOnlyService: true,
        isHiddenService: 1,
        relyingParty: {
          params: {
            hideApprover: "true",
            hideSupport: "true",
            helpHidden: "true",
          },
        },
      }),
    ).toBe(true);
  });

  it("returns false for an id-only service when isHiddenService is 0", () => {
    expect(
      isServiceHiddenFromDb({
        isIdOnlyService: true,
        isHiddenService: 0,
        relyingParty: {
          params: {
            hideApprover: "true",
            hideSupport: "true",
            helpHidden: "true",
          },
        },
      }),
    ).toBe(false);
  });

  it("returns true for a role-based service when all three params are truthy strings", () => {
    expect(
      isServiceHiddenFromDb({
        isIdOnlyService: false,
        relyingParty: {
          params: {
            hideApprover: "true",
            hideSupport: "true",
            helpHidden: "true",
          },
        },
      }),
    ).toBe(true);
  });

  it("returns false for a role-based service when hideSupport is false", () => {
    expect(
      isServiceHiddenFromDb({
        isIdOnlyService: false,
        relyingParty: {
          params: {
            hideApprover: "true",
            hideSupport: "false",
            helpHidden: "true",
          },
        },
      }),
    ).toBe(false);
  });

  it("returns false when all params are absent", () => {
    expect(
      isServiceHiddenFromDb({
        isIdOnlyService: false,
        relyingParty: { params: {} },
      }),
    ).toBe(false);
  });

  it("treats boolean true as truthy", () => {
    expect(
      isServiceHiddenFromDb({
        isIdOnlyService: false,
        relyingParty: {
          params: { hideApprover: true, hideSupport: true, helpHidden: true },
        },
      }),
    ).toBe(true);
  });

  it("treats integer 1 as truthy", () => {
    expect(
      isServiceHiddenFromDb({
        isIdOnlyService: false,
        relyingParty: {
          params: { hideApprover: 1, hideSupport: 1, helpHidden: 1 },
        },
      }),
    ).toBe(true);
  });
});

const { getRequestMock, getResponseMock } = require("../../utils");
const {
  getServiceRaw,
  updateService,
} = require("login.dfe.api-client/services");
const {
  postServiceConfig,
} = require("../../../src/app/services/serviceConfig");
const {
  getUserServiceRoles,
  checkClientId,
} = require("../../../src/app/services/utils");

describe("S8 regression — hiding a service with no existing hide params (no crash)", () => {
  // Reproduces the bug: a service whose relyingParty.params has only
  // minimumRolesRequired (no hideApprover/hideSupport/helpHidden).
  // Before the fix, ticking the hide checkbox caused a 500 error on the
  // review page because editedFields was empty and the session write was
  // skipped, leaving isServiceHidden undefined when confirmServiceConfig
  // tried to read it.  The fix added `|| hideServiceChanged` to the
  // condition so the session always records the hide-state change.

  let req;
  let res;

  const serviceWithOnlyMinRoles = {
    id: "service1",
    name: "service one",
    description: "service description",
    isIdOnlyService: false,
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
      // No hideApprover / hideSupport / helpHidden — only minimumRolesRequired
      params: { minimumRolesRequired: 5 },
    },
  };

  beforeEach(() => {
    res = getResponseMock();

    // User submits the form with the hide checkbox ticked and otherwise
    // unchanged values (same redirect URIs, same client ID, etc.)
    req = getRequestMock({
      body: {
        clientId: "clientid",
        clientSecret: "dewier-thrombi-confounder-mikado",
        serviceHome: "https://www.servicehome.com",
        postResetUrl: "https://www.postreset.com",
        redirect_uris: ["https://www.redirect.com"],
        post_logout_redirect_uris: ["https://www.logout.com"],
        response_types: ["code"],
        apiSecret: "dewier-thrombi-confounder-mikado",
        tokenEndpointAuthMethod: "client_secret_post",
        isServiceHidden: "on", // user ticked the hide checkbox
      },
      params: { sid: "service1" },
      query: {},
      session: {
        passport: { user: { sub: "user_id_uuid" } },
      },
    });

    getUserServiceRoles.mockReset();
    getUserServiceRoles.mockImplementation(() => Promise.resolve([]));
    checkClientId.mockReset();
    checkClientId.mockResolvedValue(null);

    updateService.mockReset();
    updateService.mockImplementation(() => Promise.resolve([]));
    getServiceRaw.mockReset();
    getServiceRaw.mockReturnValueOnce({ ...serviceWithOnlyMinRoles });
    res.mockResetAll();
  });

  it("redirects to review page when service has no hide params (only minimumRolesRequired)", async () => {
    // ARRANGE — all done in beforeEach

    // ACT
    await postServiceConfig(req, res);

    // ASSERT: should redirect (not crash with a 500) and store the hide change
    expect(res.redirect).toHaveBeenCalledWith("review-service-configuration#");

    // The session must record the hide-state change so confirmServiceConfig
    // can display and apply it later (absence of this entry was the S8 root cause)
    expect(
      req.session.serviceConfigurationChanges["service1"].isServiceHidden,
    ).toEqual({ oldValue: "Visible", newValue: "Hidden" });
  });
});
