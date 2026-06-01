jest.mock("login.dfe.api-client/services", () => ({
  updateService: jest.fn(),
}));

const {
  updateService: updateServiceApiClient,
} = require("login.dfe.api-client/services");
const {
  updateService,
} = require("./../../../src/infrastructure/utils/services");

describe("updateService", () => {
  beforeEach(() => {
    updateServiceApiClient.mockReset();
  });

  it("should pass isHiddenService to the api-client when provided as 1", async () => {
    await updateService("service1", { isHiddenService: 1 });

    expect(updateServiceApiClient).toHaveBeenCalledWith({
      serviceId: "service1",
      update: { isHiddenService: 1 },
    });
  });

  it("should pass isHiddenService to the api-client when provided as 0", async () => {
    await updateService("service1", { isHiddenService: 0 });

    expect(updateServiceApiClient).toHaveBeenCalledWith({
      serviceId: "service1",
      update: { isHiddenService: 0 },
    });
  });

  it("should NOT include isHiddenService in the update when not provided", async () => {
    await updateService("service1", { name: "My Service" });

    expect(updateServiceApiClient).toHaveBeenCalledWith({
      serviceId: "service1",
      update: { name: "My Service" },
    });
    const calledWith = updateServiceApiClient.mock.calls[0][0];
    expect(calledWith.update).not.toHaveProperty("isHiddenService");
  });
});
