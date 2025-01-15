jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/infrastructure/applications");

const { getRequestMock, getResponseMock } = require("./../../utils");
const getNewServiceBanner =
  require("./../../../src/app/services/newServiceBanner").get;
const { getBannerById } = require("./../../../src/infrastructure/applications");
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

  it("then it should return the new service banner view", async () => {
    await getNewServiceBanner(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/newServiceBanner");
  });

  it("then it should include csrf token", async () => {
    await getNewServiceBanner(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
    });
  });

  it("then it should get the banner by id if editing banner", async () => {
    await getNewServiceBanner(req, res);

    expect(getBannerById.mock.calls).toHaveLength(1);
    expect(getBannerById.mock.calls[0][0]).toBe("service1");
    expect(getBannerById.mock.calls[0][1]).toBe("bannerId");
    expect(getBannerById.mock.calls[0][2]).toBe("correlationId");
  });

  it("then it should include the banner being edited details", async () => {
    await getNewServiceBanner(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      isEditExisting: true,
      name: "banner name",
      bannerTitle: "banner title",
      message: "banner message",
    });
  });

  it("then it should not get the banner by id if creating banner", async () => {
    req.params.bid = null;
    await getNewServiceBanner(req, res);

    expect(getBannerById.mock.calls).toHaveLength(0);
  });
});
