jest.mock("login.dfe.api-client/services", () => ({
  getServiceBannersRaw: jest.fn(),
}));

const { getServiceBannersRaw } = require("login.dfe.api-client/services");
const {
  listAllBannersForService,
} = require("./../../../src/infrastructure/utils/banners");

describe("listAllBannersForService", () => {
  beforeEach(() => {
    getServiceBannersRaw.mockReset();
  });

  it("should return all banners from a single page", async () => {
    getServiceBannersRaw.mockResolvedValue({
      banners: [{ id: "banner1" }, { id: "banner2" }],
      totalNumberOfPages: 1,
      totalNumberOfRecords: 2,
    });

    const result = await listAllBannersForService("service1");
    expect(getServiceBannersRaw).toHaveBeenCalledWith({
      serviceId: "service1",
      pageSize: 25,
      page: 1,
    });
    expect(result).toEqual([{ id: "banner1" }, { id: "banner2" }]);
  });

  it("should return all banners across multiple pages", async () => {
    getServiceBannersRaw
      .mockResolvedValueOnce({
        banners: [{ id: "banner1" }],
        totalNumberOfRecords: 2,
        totalNumberOfPages: 2,
      })
      .mockResolvedValueOnce({
        banners: [{ id: "banner2" }],
        totalNumberOfPages: 2,
        totalNumberOfRecords: 2,
      });

    const result = await listAllBannersForService("service1");
    expect(getServiceBannersRaw).toHaveBeenCalledTimes(2);
    expect(getServiceBannersRaw).toHaveBeenNthCalledWith(1, {
      serviceId: "service1",
      pageSize: 25,
      page: 1,
    });
    expect(getServiceBannersRaw).toHaveBeenNthCalledWith(2, {
      serviceId: "service1",
      pageSize: 25,
      page: 2,
    });
    expect(result).toEqual([{ id: "banner1" }, { id: "banner2" }]);
  });

  it("should return an empty array if no banners are found", async () => {
    getServiceBannersRaw.mockResolvedValue({
      banners: [],
      totalNumberOfPages: 1,
      totalNumberOfRecords: 0,
    });

    const result = await listAllBannersForService("service1");
    expect(result).toEqual([]);
  });
});
