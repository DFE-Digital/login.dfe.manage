jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.jobs-client", () => ({
  ServiceNotificationsClient: jest.fn(),
}));
jest.mock("./../../../src/app/services/utils");
jest.mock("login.dfe.api-client/organisations");

const { getRequestMock, getResponseMock } = require("./../../utils");
const { getOrganisationRaw } = require("login.dfe.api-client/organisations");
const { ServiceNotificationsClient } = require("login.dfe.jobs-client");
const webServiceSyncOrg = require("./../../../src/app/services/webServiceSyncOrg");

const res = getResponseMock();
const orgResult = { id: "org-1", name: "organisation one" };
const serviceNotificationsClient = {
  notifyOrganisationUpdated: jest.fn(),
};

describe("when syncing organisation for sync", function () {
  let req;

  beforeEach(() => {
    getOrganisationRaw.mockReset().mockReturnValue(orgResult);

    serviceNotificationsClient.notifyOrganisationUpdated.mockReset();
    ServiceNotificationsClient.mockReset().mockImplementation(
      () => serviceNotificationsClient,
    );

    req = getRequestMock({
      params: {
        oid: "org-1",
        sid: "service-1",
      },
    });

    res.mockResetAll();
  });

  it("then it should prompt for confirmation with organisation details", async () => {
    await webServiceSyncOrg.get(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe(
      "services/views/webServiceSyncOrg",
    );
  });

  // it('then it should queue organisation for sync on confirmation', async () => {
  //   await webServiceSyncOrg.post(req, res);

  //   expect(serviceNotificationsClient.notifyOrganisationUpdated).toHaveBeenCalledTimes(1);
  //   expect(serviceNotificationsClient.notifyOrganisationUpdated).toHaveBeenCalledWith(orgResult);
  // });

  // it('then it should add flash message that organisation has been queued on confirmation', async () => {
  //   await webServiceSyncOrg.post(req, res);

  //   expect(res.flash).toHaveBeenCalledTimes(1);
  //   expect(res.flash).toHaveBeenCalledWith('info', 'Organisation has been queued for sync');
  // });

  // it('then it should redirect to organisation details page on confirmation', async () => {
  //   await webServiceSyncOrg.post(req, res);

  //   expect(res.redirect).toHaveBeenCalledTimes(1);
  //   expect(res.redirect).toHaveBeenCalledWith('/services/service-1/organisations/org-1/users');
  // });
});
