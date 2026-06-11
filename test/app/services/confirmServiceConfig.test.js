jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.api-client/services");
jest.mock("login.dfe.api-client/encryption", () => ({
  encrypt: jest.fn().mockReturnValue("encrypted-secret"),
}));
jest.mock("./../../../src/infrastructure/utils/services", () => ({
  updateService: jest.fn(),
}));
jest.mock("./../../../src/app/services/utils");
jest.mock("login.dfe.validation/src/urlValidator", () =>
  jest.fn().mockImplementation(() => ({})),
);

const {
  getServiceRaw,
  updateServiceParam,
} = require("login.dfe.api-client/services");
const {
  updateService,
} = require("./../../../src/infrastructure/utils/services");
const {
  getUserServiceRoles,
  isCorrectLength,
  isValidUrl,
  isCorrectProtocol,
  checkClientId,
  processRedirectUris,
  processConfigurationTypes,
} = require("./../../../src/app/services/utils");

const {
  postConfirmServiceConfig,
} = require("./../../../src/app/services/confirmServiceConfig");

const SERVICE_ID = "service-abc-123";

const buildSession = (hideNewValue) => ({
  serviceConfigurationChanges: {
    [SERVICE_ID]: {
      authFlowType: "authorisationCodeFlow",
      redirectUris: {
        oldValue: ["https://redirect.example.com/callback"],
        newValue: undefined,
      },
      postLogoutRedirectUris: {
        oldValue: ["https://logout.example.com"],
        newValue: undefined,
      },
      ...(hideNewValue !== undefined && {
        isServiceHidden: {
          oldValue: hideNewValue === "Hidden" ? "Visible" : "Hidden",
          newValue: hideNewValue,
        },
      }),
    },
  },
});

const buildReq = (hideNewValue) => ({
  params: { sid: SERVICE_ID },
  user: { sub: "user1", email: "admin@test.com" },
  csrfToken: () => "token",
  flash: jest.fn(),
  session: buildSession(hideNewValue),
});

describe("postConfirmServiceConfig — hide service", () => {
  let res;

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      flash: jest.fn(),
    };

    getUserServiceRoles.mockResolvedValue([]);
    processRedirectUris.mockImplementation((v) =>
      Array.isArray(v) ? v : v ? [v] : [],
    );
    processConfigurationTypes.mockImplementation((v) =>
      Array.isArray(v) ? v : v ? [v] : [],
    );
    isCorrectLength.mockResolvedValue(true);
    isValidUrl.mockResolvedValue(true);
    isCorrectProtocol.mockResolvedValue(true);
    checkClientId.mockResolvedValue(false);
    updateService.mockResolvedValue();
    updateServiceParam.mockResolvedValue();
  });

  describe("hiding a role-based service", () => {
    beforeEach(() => {
      getServiceRaw.mockResolvedValue({
        name: "Test Service",
        isIdOnlyService: false,
        relyingParty: {
          client_id: "client-1",
          redirect_uris: ["https://redirect.example.com/callback"],
          post_logout_redirect_uris: ["https://logout.example.com"],
          response_types: ["code"],
          grant_types: ["authorization_code"],
        },
      });
    });

    it("calls updateServiceParam for hideApprover, hideSupport, and helpHidden with 'true'", async () => {
      const req = buildReq("Hidden");
      await postConfirmServiceConfig(req, res);

      expect(updateServiceParam).toHaveBeenCalledWith({
        serviceId: SERVICE_ID,
        paramName: "hideApprover",
        paramValue: "true",
      });
      expect(updateServiceParam).toHaveBeenCalledWith({
        serviceId: SERVICE_ID,
        paramName: "hideSupport",
        paramValue: "true",
      });
      expect(updateServiceParam).toHaveBeenCalledWith({
        serviceId: SERVICE_ID,
        paramName: "helpHidden",
        paramValue: "true",
      });
    });

    it("does NOT include isHiddenService in the updateService call", async () => {
      const req = buildReq("Hidden");
      await postConfirmServiceConfig(req, res);

      const serviceUpdateArg = updateService.mock.calls[0]?.[1];
      expect(serviceUpdateArg).not.toHaveProperty("isHiddenService");
    });
  });

  describe("hiding an id-only service", () => {
    beforeEach(() => {
      getServiceRaw.mockResolvedValue({
        name: "ID Only Service",
        isIdOnlyService: true,
        relyingParty: {
          client_id: "client-id-only",
          redirect_uris: ["https://redirect.example.com/callback"],
          post_logout_redirect_uris: ["https://logout.example.com"],
          response_types: ["code"],
          grant_types: ["authorization_code"],
        },
      });
    });

    it("includes isHiddenService=1 in the updateService call", async () => {
      const req = buildReq("Hidden");
      await postConfirmServiceConfig(req, res);

      expect(updateService).toHaveBeenCalledWith(
        SERVICE_ID,
        expect.objectContaining({ isHiddenService: 1 }),
      );
    });

    it("includes isHiddenService=0 when revealing the service", async () => {
      const req = buildReq("Visible");
      await postConfirmServiceConfig(req, res);

      expect(updateService).toHaveBeenCalledWith(
        SERVICE_ID,
        expect.objectContaining({ isHiddenService: 0 }),
      );
    });
  });

  describe("revealing a role-based service", () => {
    beforeEach(() => {
      getServiceRaw.mockResolvedValue({
        name: "Test Service",
        isIdOnlyService: false,
        relyingParty: {
          client_id: "client-1",
          redirect_uris: ["https://redirect.example.com/callback"],
          post_logout_redirect_uris: ["https://logout.example.com"],
          response_types: ["code"],
          grant_types: ["authorization_code"],
        },
      });
    });

    it("calls updateServiceParam for all three params with 'false'", async () => {
      const req = buildReq("Visible");
      await postConfirmServiceConfig(req, res);

      expect(updateServiceParam).toHaveBeenCalledWith({
        serviceId: SERVICE_ID,
        paramName: "hideApprover",
        paramValue: "false",
      });
      expect(updateServiceParam).toHaveBeenCalledWith({
        serviceId: SERVICE_ID,
        paramName: "hideSupport",
        paramValue: "false",
      });
      expect(updateServiceParam).toHaveBeenCalledWith({
        serviceId: SERVICE_ID,
        paramName: "helpHidden",
        paramValue: "false",
      });
    });
  });

  describe("when isServiceHidden is not in session (no hide change)", () => {
    beforeEach(() => {
      getServiceRaw.mockResolvedValue({
        name: "Test Service",
        isIdOnlyService: false,
        relyingParty: {
          client_id: "client-1",
          redirect_uris: ["https://redirect.example.com/callback"],
          post_logout_redirect_uris: ["https://logout.example.com"],
          response_types: ["code"],
          grant_types: ["authorization_code"],
        },
      });
    });

    it("does NOT call updateServiceParam", async () => {
      const req = buildReq(undefined);
      await postConfirmServiceConfig(req, res);

      expect(updateServiceParam).not.toHaveBeenCalled();
    });
  });
});
