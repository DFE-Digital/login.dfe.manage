jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/infrastructure/applications");

const logger = require("./../../../src/infrastructure/logger");
const { getRequestMock, getResponseMock } = require("./../../utils");
const postDeleteServiceBanner =
  require("./../../../src/app/services/deleteServiceBanner").post;
const { removeBanner } = require("./../../../src/infrastructure/applications");
const res = getResponseMock();

describe("when deleting a service banner", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service1",
        bid: "bannerId",
      },
    });

    removeBanner.mockReset();
    res.mockResetAll();
  });

  it("then it should delete the banner", async () => {
    await postDeleteServiceBanner(req, res);

    expect(removeBanner.mock.calls).toHaveLength(1);
    expect(removeBanner.mock.calls[0][0]).toBe("service1");
    expect(removeBanner.mock.calls[0][1]).toBe("bannerId");
    expect(removeBanner.mock.calls[0][2]).toBe("correlationId");
  });

  it("then it should redirect to service banners", async () => {
    await postDeleteServiceBanner(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/services/${req.params.sid}/service-banners`,
    );
  });

  it("then a flash message is displayed showing service banner has been deleted", async () => {
    await postDeleteServiceBanner(req, res);

    expect(res.flash.mock.calls).toHaveLength(1);
    expect(res.flash.mock.calls[0][0]).toBe("info");
    expect(res.flash.mock.calls[0][1]).toBe(`Banner successfully deleted`);
  });

  it("then it should should audit user being viewed", async () => {
    await postDeleteServiceBanner(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe(
      "user@unit.test (id: user1) removed banner bannerId for service service1",
    );
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: "manage",
      subType: "service-banner-deleted",
      userId: "user1",
      userEmail: "user@unit.test",
      editedFields: [
        {
          name: "delete_banner",
          oldValue: "bannerId",
          newValue: undefined,
        },
      ],
    });
  });
});
