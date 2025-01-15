jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/infrastructure/applications");

const { getRequestMock, getResponseMock } = require("./../../utils");
const getDeleteServiceBanner =
  require("./../../../src/app/services/deleteServiceBanner").get;
const { getBannerById } = require("./../../../src/infrastructure/applications");
const res = getResponseMock();

describe("when getting the delete service banner", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service1",
        bid: "bannerId",
      },
      userServices: {
        roles: [
          {
            code: "serviceid_serviceconfiguration",
          },
        ],
      },
    });

    getBannerById.mockReset();
    getBannerById.mockReturnValue({
      id: "bannerId",
      serviceId: "serviceId",
      name: "banner name",
      title: "banner title",
      message: "banner message",
    });
    res.mockResetAll();
  });

  it("then it should get the banner by id", async () => {
    await getDeleteServiceBanner(req, res);

    expect(getBannerById.mock.calls).toHaveLength(1);
    expect(getBannerById.mock.calls[0][0]).toBe("service1");
    expect(getBannerById.mock.calls[0][1]).toBe("bannerId");
    expect(getBannerById.mock.calls[0][2]).toBe("correlationId");
  });

  it("then it should return the delete service banner", async () => {
    await getDeleteServiceBanner(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe(
      "services/views/deleteServiceBanner",
    );
  });

  it("then it should include csrf token", async () => {
    await getDeleteServiceBanner(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
    });
  });

  it("then it should include the banner being deleted", async () => {
    await getDeleteServiceBanner(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      serviceBanners: {
        serviceId: "serviceId",
        id: "bannerId",
        name: "banner name",
        title: "banner title",
        message: "banner message",
      },
    });
  });
});
