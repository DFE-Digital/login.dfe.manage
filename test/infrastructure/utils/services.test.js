const path = require("path");

let updateService;
let updateServiceApiClient;
let mockRequestRaw;

beforeAll(() => {
  jest.resetModules();

  updateServiceApiClient = jest.fn().mockResolvedValue();
  jest.doMock("login.dfe.api-client/services", () => ({
    updateService: updateServiceApiClient,
  }));

  mockRequestRaw = jest.fn().mockResolvedValue({ ok: true });

  const apiClientRoot = path.dirname(
    path.dirname(
      path.dirname(require.resolve("login.dfe.api-client/services")),
    ),
  );

  jest.doMock(path.join(apiClientRoot, "dist", "api", "index.js"), () => ({
    getApiClient: jest.fn().mockReturnValue({ requestRaw: mockRequestRaw }),
    ApiName: { Applications: "applications" },
  }));

  jest.doMock(
    path.join(apiClientRoot, "dist", "api", "common", "ApiClient.js"),
    () => ({ RequestMethod: { PATCH: "PATCH" } }),
  );

  ({ updateService } = require("../../../src/infrastructure/utils/services"));
});

afterAll(() => {
  jest.resetModules();
});

describe("updateService", () => {
  beforeEach(() => {
    updateServiceApiClient.mockClear();
    mockRequestRaw.mockClear();
  });

  it("passes name to the api-client when provided", async () => {
    await updateService("svc-123", { name: "My Service" });

    expect(updateServiceApiClient).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ name: "My Service" }),
      }),
    );
  });

  it("does NOT include isHiddenService in the api-client update call", async () => {
    await updateService("svc-123", { isHiddenService: 1 });

    const updateArg = updateServiceApiClient.mock.calls[0][0].update;
    expect(updateArg).not.toHaveProperty("isHiddenService");
  });

  it("makes a direct PATCH for isHiddenService=1 when provided", async () => {
    await updateService("svc-123", { isHiddenService: 1 });

    expect(mockRequestRaw).toHaveBeenCalledWith(
      "PATCH",
      "/services/svc-123",
      expect.objectContaining({ jsonBody: { isHiddenService: 1 } }),
    );
  });

  it("makes a direct PATCH for isHiddenService=0 when provided", async () => {
    await updateService("svc-123", { isHiddenService: 0 });

    expect(mockRequestRaw).toHaveBeenCalledWith(
      "PATCH",
      "/services/svc-123",
      expect.objectContaining({ jsonBody: { isHiddenService: 0 } }),
    );
  });

  it("does NOT make a direct PATCH when isHiddenService is not provided", async () => {
    await updateService("svc-123", { name: "My Service" });

    expect(mockRequestRaw).not.toHaveBeenCalled();
  });
});
