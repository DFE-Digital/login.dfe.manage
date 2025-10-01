jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.api-client/services");

const { getRequestMock, getResponseMock } = require("./../../utils");
const getNewServiceBanner =
  require("./../../../src/app/services/newServiceBanner").get;
const { getServiceBannerRaw } = require("login.dfe.api-client/services");
const res = getResponseMock();

describe("when getting the create new service banner view", () => {
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

  it("then it should return the new service banner view", async () => {
    await getNewServiceBanner(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/newServiceBanner");
  });

  it("then it should get the banner by id if editing banner", async () => {
    await getNewServiceBanner(req, res);

    expect(getServiceBannerRaw.mock.calls).toHaveLength(1);
    expect(getServiceBannerRaw).toHaveBeenCalledWith({
      bannerId: "bannerId",
      serviceId: "service1",
    });
  });

  it("then it should include the banner being edited details and csrf token", async () => {
    await getNewServiceBanner(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      isEditExisting: true,
      name: "banner name",
      bannerTitle: "banner title",
      message: "banner message",
      csrfToken: "token",
    });
  });

  it("then it should not get the banner by id if creating banner", async () => {
    req.params.bid = null;
    await getNewServiceBanner(req, res);

    expect(getServiceBannerRaw.mock.calls).toHaveLength(0);
  });
});
