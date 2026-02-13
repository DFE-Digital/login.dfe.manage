jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.api-client/services");

const logger = require("./../../../src/infrastructure/logger");
const { getRequestMock, getResponseMock } = require("./../../utils");
const postDeleteServiceBanner =
  require("./../../../src/app/services/deleteServiceBanner").post;
const { deleteServiceBanner } = require("login.dfe.api-client/services");
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

    deleteServiceBanner.mockReset();
    res.mockResetAll();
  });

  it("then it should delete the banner", async () => {
    await postDeleteServiceBanner(req, res);

    expect(deleteServiceBanner.mock.calls).toHaveLength(1);
    expect(deleteServiceBanner).toHaveBeenCalledWith({
      bannerId: "bannerId",
      serviceId: "service1",
    });
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
      "user@unit.test removed banner bannerId for service service1",
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
