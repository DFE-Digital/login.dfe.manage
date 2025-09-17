jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.api-client/services");

const { getRequestMock, getResponseMock } = require("./../../utils");
const getDeleteServiceBanner =
  require("./../../../src/app/services/deleteServiceBanner").get;
const { getServiceBannerRaw } = require("login.dfe.api-client/services");
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

    getServiceBannerRaw.mockReset();
    getServiceBannerRaw.mockReturnValue({
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

    expect(getServiceBannerRaw.mock.calls).toHaveLength(1);
    expect(getServiceBannerRaw).toHaveBeenCalledWith({
      bannerId: "bannerId",
      serviceId: "service1",
    });
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
