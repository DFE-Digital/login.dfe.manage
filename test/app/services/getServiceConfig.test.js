jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);

jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
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
  };
});

const { getRequestMock, getResponseMock } = require("../../utils");
const { getServiceConfig } = require("../../../src/app/services/serviceConfig");
const { getServiceById } = require("../../../src/infrastructure/applications");
const { getUserServiceRoles } = require("../../../src/app/services/utils");
const { ACTIONS } = require("../../../src/constants/serviceConfigConstants");

const res = getResponseMock();

describe("when getting the service config page", () => {
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

    getServiceById.mockReset();
    getServiceById.mockReturnValue({
      id: "service1",
      name: "service one",
      description: "service description",
      relyingParty: {
        token_endpoint_auth_method: "test",
        client_id: "clientid",
        client_secret: "dewier-thrombi-confounder-mikado",
        api_secret: "dewier-thrombi-confounder-mikado",
        service_home: "https://www.servicehome.com",
        postResetUrl: "https://www.postreset.com",
        redirect_uris: ["https://www.redirect.com"],
        post_logout_redirect_uris: ["https://www.logout.com"],
        grant_types: ["implicit", "authorization_code"],
        response_types: ["code"],
      },
    });
    getUserServiceRoles.mockReset();
    getUserServiceRoles.mockImplementation(() => Promise.resolve([]));
    res.mockResetAll();
  });

  it("then it should get the user service roles by calling getUserServiceRoles function", async () => {
    await getServiceConfig(req, res);

    expect(getUserServiceRoles).toHaveBeenCalledTimes(1);
  });

  it("then it should throw an error if unable to getUserServiceRoles", async () => {
    const errorMessage = "Error fetching user roles";
    getUserServiceRoles.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    await expect(getServiceConfig(req, res)).rejects.toThrow(
      new RegExp(errorMessage, "i"),
    );
  });

  it("then it should get the service by id", async () => {
    await getServiceConfig(req, res);

    expect(getServiceById.mock.calls).toHaveLength(1);
    expect(getServiceById.mock.calls[0][0]).toBe("service1");
    expect(getServiceById.mock.calls[0][1]).toBe("correlationId");
  });

  it("should throw an error when unable to get the service by id", async () => {
    const errorMessage = "Error fetching service by ID";

    getServiceById.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    await expect(getServiceConfig(req, res)).rejects.toThrow(
      new RegExp(errorMessage, "i"),
    );
  });

  it("then it should include csrf token in model", async () => {
    await getServiceConfig(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
    });
  });

  it("then it should set the backLink correctly in the model", async () => {
    await getServiceConfig(req, res);

    expect(res.render.mock.calls[0][1].backLink).toBe("/services/service1");
  });

  it("then it should include user roles in the model", async () => {
    const mockRoles = ["userConfigRole"];
    getUserServiceRoles.mockImplementation(() => Promise.resolve(mockRoles));

    await getServiceConfig(req, res);
    expect(res.render.mock.calls[0][1].userRoles).toEqual(mockRoles);
  });

  it('then it should set currentNavigation to "configuration"', async () => {
    await getServiceConfig(req, res);

    expect(res.render.mock.calls[0][1].currentNavigation).toEqual(
      "configuration",
    );
  });

  it("then it should include the service in the model", async () => {
    await getServiceConfig(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      service: {
        clientId: "clientid",
        clientSecret: "dewier-thrombi-confounder-mikado",
        description: "service description",
        grantTypes: ["implicit", "authorization_code"],
        postLogoutRedirectUris: ["https://www.logout.com"],
        postResetUrl: "https://www.postreset.com",
        redirectUris: ["https://www.redirect.com"],
        responseTypes: ["code"],
        serviceHome: "https://www.servicehome.com",
      },
    });
  });

  it("should persist user-modified service configuration values during an amend operation on the review page", async () => {
    req.query.action = ACTIONS.AMEND_CHANGES;
    req.session.serviceConfigurationChanges = {
      clientSecret: {
        secretNewValue: "new-secret",
        newValue: "EXPUNGED",
        oldValue: "EXPUNGED",
      },
      serviceHome: {
        newValue: "https://new.servicehome.com",
        oldValue: "https://old.servicehome.com",
      },
      postResetUrl: {
        newValue: "https://new.postreset.com",
        oldValue: "https://old.postreset.com",
      },
      redirectUris: {
        newValue: "https://new.redirect.com",
        oldValue: "https://old.redirect.com",
      },
      postLogoutRedirectUris: {
        newValue: "https://new.logout.com",
        oldValue: "https://old.logout.com",
      },
      grantTypes: {
        newValue: ["refresh_token", "authorization_code"],
        oldValue: ["implicit"],
      },
      responseTypes: { newValue: ["code", "id_token"], oldValue: ["code"] },
      apiSecret: {
        secretNewValue: "new-api-secret",
        oldValue: "old-api-secret",
      },
    };

    await getServiceConfig(req, res);

    expect(res.render.mock.calls[0][1].service).toEqual({
      apiSecret: "new-api-secret",
      clientId: "clientid",
      clientSecret: "new-secret",
      description: "service description",
      grantTypes: ["refresh_token", "authorization_code"],
      name: "service one",
      postLogoutRedirectUris: "https://new.logout.com",
      postResetUrl: "https://new.postreset.com",
      redirectUris: "https://new.redirect.com",
      responseTypes: ["code", "id_token"],
      serviceHome: "https://new.servicehome.com",
      tokenEndpointAuthMethod: "client_secret_basic",
      refreshToken: "refresh_token",
    });
  });

  it("should persist the user-modified value of tokenEndpointAuthMethod during an amend operation on the review page", async () => {
    req.query.action = ACTIONS.AMEND_CHANGES;
    req.session.serviceConfigurationChanges = {
      tokenEndpointAuthMethod: {
        newValue: "client_secret_post",
        oldValue: "client_secret_basic",
      },
    };

    await getServiceConfig(req, res);

    expect(res.render.mock.calls[0][1].service.tokenEndpointAuthMethod).toEqual(
      "client_secret_post",
    );
  });

  it("should set tokenEndpointAuthMethod correctly when service.relyingParty has token_endpoint_auth_method as client_secret_post", async () => {
    getServiceById.mockReturnValue({
      relyingParty: {
        token_endpoint_auth_method: "client_secret_post",
      },
    });

    await getServiceConfig(req, res);

    expect(res.render.mock.calls[0][1].service.tokenEndpointAuthMethod).toEqual(
      "client_secret_post",
    );
  });

  it("should set tokenEndpointAuthMethod to client_secret_basic when relyingParty.token_endpoint_auth_method is client_secret_basic", async () => {
    getServiceById.mockReturnValue({
      relyingParty: {
        token_endpoint_auth_method: null,
      },
    });
    req.session.serviceConfigurationChanges = {
      clientSecret: {
        secretNewValue: "new-secret",
        newValue: "EXPUNGED",
        oldValue: "EXPUNGED",
      },
      serviceHome: {
        newValue: "https://new.servicehome.com",
        oldValue: "https://old.servicehome.com",
      },
      postResetUrl: {
        newValue: "https://new.postreset.com",
        oldValue: "https://old.postreset.com",
      },
      grantTypes: {
        newValue: ["new-implicit", "new-authorization_code"],
        oldValue: ["old-implicit", "old-authorization_code"],
      },
      responseTypes: { newValue: ["id_token", "code"], oldValue: ["code"] },
      apiSecret: {
        secretNewValue: "new-api-secret",
        oldValue: "old-api-secret",
      },
    };
    await getServiceConfig(req, res);

    expect(res.render.mock.calls[0][1].service).toMatchObject({
      tokenEndpointAuthMethod: "client_secret_basic",
    });
  });

  it("then it should display the service config view", async () => {
    await getServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/serviceConfig");
  });
});
