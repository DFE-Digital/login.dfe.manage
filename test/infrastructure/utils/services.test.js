jest.mock("login.dfe.api-client/services", () => ({
  updateService: jest.fn(),
}));

const {
  updateService: updateServiceApiClient,
} = require("login.dfe.api-client/services");
const { updateService } = require("../../../src/infrastructure/utils/services");

describe("updateService", () => {
  beforeEach(() => {
    updateServiceApiClient.mockResolvedValue();
  });

  it("passes isHiddenService=1 to the api-client when provided", async () => {
    await updateService("svc-123", { isHiddenService: 1 });

    expect(updateServiceApiClient).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ isHiddenService: 1 }),
      }),
    );
  });

  it("passes isHiddenService=0 to the api-client when provided", async () => {
    await updateService("svc-123", { isHiddenService: 0 });

    expect(updateServiceApiClient).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ isHiddenService: 0 }),
      }),
    );
  });

  it("does NOT include isHiddenService in the update when not provided", async () => {
    await updateService("svc-123", { name: "My Service" });

    const updateArg = updateServiceApiClient.mock.calls[0][0].update;
    expect(updateArg).not.toHaveProperty("isHiddenService");
  });
});
