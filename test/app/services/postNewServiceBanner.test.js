jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/infrastructure/applications");
jest.mock("login.dfe.api-client/services");
jest.mock("./../../../src/infrastructure/utils/banners");

const logger = require("./../../../src/infrastructure/logger");
const { getRequestMock, getResponseMock } = require("./../../utils");
const postNewServiceBanner =
  require("./../../../src/app/services/newServiceBanner").post;
const { upsertBanner } = require("./../../../src/infrastructure/applications");
const { getServiceBannerRaw } = require("login.dfe.api-client/services");
const {
  listAllBannersForService,
} = require("./../../../src/infrastructure/utils/banners");
const res = getResponseMock();

describe("when creating a new service banner", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service1",
        bid: "bannerId",
      },
      body: {
        bannerName: "banner name",
        bannerTitle: "banner title",
        bannerMessage: "banner message",
        bannerDisplay: "isActive",
        fromDay: "12",
        fromMonth: "12",
        fromYear: "2019",
        fromHour: "12",
        fromMinute: "30",
        toDay: "13",
        toMonth: "12",
        toYear: "2019",
        toHour: "12",
        toMinute: "30",
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
    listAllBannersForService.mockReset();
    listAllBannersForService.mockReturnValue([
      {
        id: "bannerId",
        serviceId: "serviceId",
        name: "banner name",
        title: "banner title",
        message: "banner message",
      },
    ]);
    upsertBanner.mockReset();
    res.mockResetAll();
  });

  it("then it should render view if banner name not entered", async () => {
    req.body.bannerName = undefined;

    await postNewServiceBanner(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/newServiceBanner");
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: true,
      cancelLink: "/services/service1/service-banners",
      bannerDisplay: "isActive",
      bannerTitle: "banner title",
      csrfToken: "token",
      currentNavigation: "banners",
      fromDay: "12",
      fromHour: "12",
      fromMinute: "30",
      fromMonth: "12",
      fromYear: "2019",
      isActive: true,
      message: "banner message",
      name: "",
      serviceId: "service1",
      toDay: "13",
      toHour: "12",
      toMinute: "30",
      toMonth: "12",
      toYear: "2019",
      userRoles: [],
      bannerId: "bannerId",
      validationMessages: {
        bannerName: "Please enter a banner name",
      },
    });
  });

  it("then it should render view if banner title not entered", async () => {
    req.body.bannerTitle = undefined;

    await postNewServiceBanner(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/newServiceBanner");
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: true,
      cancelLink: "/services/service1/service-banners",
      bannerDisplay: "isActive",
      bannerTitle: "",
      csrfToken: "token",
      currentNavigation: "banners",
      fromDay: "12",
      fromHour: "12",
      fromMinute: "30",
      fromMonth: "12",
      fromYear: "2019",
      isActive: true,
      message: "banner message",
      name: "banner name",
      serviceId: "service1",
      toDay: "13",
      toHour: "12",
      toMinute: "30",
      toMonth: "12",
      toYear: "2019",
      userRoles: [],
      bannerId: "bannerId",
      validationMessages: {
        bannerTitle: "Please enter a banner title",
      },
    });
  });

  it("then it should render view if banner message not entered", async () => {
    req.body.bannerMessage = undefined;

    await postNewServiceBanner(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/newServiceBanner");
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: true,
      cancelLink: "/services/service1/service-banners",
      bannerDisplay: "isActive",
      bannerTitle: "banner title",
      csrfToken: "token",
      currentNavigation: "banners",
      fromDay: "12",
      fromHour: "12",
      fromMinute: "30",
      fromMonth: "12",
      fromYear: "2019",
      isActive: true,
      message: "",
      name: "banner name",
      serviceId: "service1",
      toDay: "13",
      toHour: "12",
      toMinute: "30",
      toMonth: "12",
      toYear: "2019",
      userRoles: [],
      bannerId: "bannerId",
      validationMessages: {
        bannerMessage: "Please enter a banner message",
      },
    });
  });

  it("then it should render view if banner display radio not selected", async () => {
    req.body.bannerDisplay = undefined;

    await postNewServiceBanner(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/newServiceBanner");
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: true,
      cancelLink: "/services/service1/service-banners",
      bannerDisplay: "",
      bannerTitle: "banner title",
      csrfToken: "token",
      currentNavigation: "banners",
      fromDay: "12",
      fromHour: "12",
      fromMinute: "30",
      fromMonth: "12",
      fromYear: "2019",
      isActive: false,
      message: "banner message",
      name: "banner name",
      serviceId: "service1",
      toDay: "13",
      toHour: "12",
      toMinute: "30",
      toMonth: "12",
      toYear: "2019",
      userRoles: [],
      bannerId: "bannerId",
      validationMessages: {
        bannerDisplay: "Please select when you want the banner to be displayed",
      },
    });
  });

  it("then it should render view if banner display radio is date but no from date entered", async () => {
    req.body.bannerDisplay = "date";
    req.body.fromYear = undefined;

    await postNewServiceBanner(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/newServiceBanner");
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: true,
      cancelLink: "/services/service1/service-banners",
      bannerDisplay: "date",
      bannerTitle: "banner title",
      csrfToken: "token",
      currentNavigation: "banners",
      fromDay: "12",
      fromHour: "12",
      fromMinute: "30",
      fromMonth: "12",
      toDate: "2019-12-13 12:30",
      isActive: false,
      message: "banner message",
      name: "banner name",
      serviceId: "service1",
      toDay: "13",
      toHour: "12",
      toMinute: "30",
      toMonth: "12",
      toYear: "2019",
      userRoles: [],
      bannerId: "bannerId",
      validationMessages: {
        fromDate: "Please enter a from date",
      },
    });
  });

  it("then it should render view if banner display radio is date but no to date entered", async () => {
    req.body.bannerDisplay = "date";
    req.body.toYear = undefined;

    await postNewServiceBanner(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/newServiceBanner");
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: true,
      cancelLink: "/services/service1/service-banners",
      bannerDisplay: "date",
      bannerTitle: "banner title",
      csrfToken: "token",
      currentNavigation: "banners",
      fromDay: "12",
      fromHour: "12",
      fromMinute: "30",
      fromMonth: "12",
      fromYear: "2019",
      fromDate: "2019-12-12 12:30",
      isActive: false,
      message: "banner message",
      name: "banner name",
      serviceId: "service1",
      toDay: "13",
      toHour: "12",
      toMinute: "30",
      toMonth: "12",
      userRoles: [],
      bannerId: "bannerId",
      validationMessages: {
        toDate: "Please enter a to date",
      },
    });
  });

  it("then it should render view if toDate before fromDate", async () => {
    req.body.bannerDisplay = "date";
    req.body.fromDay = "18";

    await postNewServiceBanner(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/newServiceBanner");
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: true,
      bannerId: "bannerId",
      cancelLink: "/services/service1/service-banners",
      bannerDisplay: "date",
      bannerTitle: "banner title",
      csrfToken: "token",
      currentNavigation: "banners",
      fromDay: "18",
      fromHour: "12",
      fromMinute: "30",
      fromMonth: "12",
      fromYear: "2019",
      fromDate: "2019-12-18 12:30",
      toDate: "2019-12-13 12:30",
      isActive: false,
      message: "banner message",
      name: "banner name",
      serviceId: "service1",
      toDay: "13",
      toHour: "12",
      toMinute: "30",
      toMonth: "12",
      toYear: "2019",
      userRoles: [],
      validationMessages: {
        toDate: "To date must be after from date",
      },
    });
  });

  it("then it should upsert the banner", async () => {
    await postNewServiceBanner(req, res);

    expect(upsertBanner.mock.calls).toHaveLength(1);
    expect(upsertBanner.mock.calls[0][0]).toBe("service1");
    expect(upsertBanner.mock.calls[0][1]).toEqual({
      id: "bannerId",
      isActive: true,
      message: "banner message",
      name: "banner name",
      title: "banner title",
      validFrom: null,
      validTo: null,
    });
    expect(upsertBanner.mock.calls[0][2]).toBe("correlationId");
  });

  it("then it should redirect to service banners", async () => {
    await postNewServiceBanner(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/services/${req.params.sid}/service-banners`,
    );
  });

  it("then a flash message is displayed showing service banner have been added", async () => {
    req.params.bid = null;

    await postNewServiceBanner(req, res);

    expect(res.flash.mock.calls).toHaveLength(1);
    expect(res.flash.mock.calls[0][0]).toBe("info");
    expect(res.flash.mock.calls[0][1]).toBe(
      `Service banner created successfully`,
    );
  });

  it("then a flash message is displayed showing service banner have been updated", async () => {
    await postNewServiceBanner(req, res);

    expect(res.flash.mock.calls).toHaveLength(1);
    expect(res.flash.mock.calls[0][0]).toBe("info");
    expect(res.flash.mock.calls[0][1]).toBe(
      `Service banner updated successfully`,
    );
  });

  it("then it should should audit banner being edited if banner id", async () => {
    await postNewServiceBanner(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe(
      "user@unit.test (id: user1) updated banner banner name (bannerId) for service service1",
    );
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: "manage",
      subType: "service-banner-updated",
      userId: "user1",
      userEmail: "user@unit.test",
      editedBanner: "bannerId",
    });
  });

  it("then it should should audit banner being created if no banner id ", async () => {
    req.params.bid = null;
    await postNewServiceBanner(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe(
      "user@unit.test (id: user1) created banner banner name for service service1",
    );
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: "manage",
      subType: "service-banner-created",
      userId: "user1",
      userEmail: "user@unit.test",
    });
  });
});
