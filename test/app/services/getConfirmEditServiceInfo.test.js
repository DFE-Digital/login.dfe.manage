jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);
jest.mock("../../../src/app/services/utils");
jest.mock("login.dfe.api-client/api/setup");
jest.mock("login.dfe.api-client/services", () => ({
  getServiceRaw: jest.fn(),
}));

const { getRequestMock, getResponseMock } = require("../../utils");
const getConfirmEditServiceInfo = require("../../../src/app/services/getConfirmEditServiceInfo");
const { getServiceRaw } = require("login.dfe.api-client/services");
const { getUserServiceRoles } = require("../../../src/app/services/utils");

const res = getResponseMock();
const serviceId = "service-1";
const getServiceByIdData = {
  id: "service-1",
  name: "service one",
  description: "service description",
  // Other fields would be present, but omitted for brevity
};

describe("when getting the edit service info page", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service-1",
      },
      session: {
        editServiceInfo: {
          name: "new-name-1",
          description: "new-description-1",
        },
      },
      userServices: {
        roles: [
          {
            code: "serviceid_serviceconfiguration",
          },
        ],
      },
    });

    getServiceRaw.mockReset();
    getServiceRaw.mockReturnValue(getServiceByIdData);

    getUserServiceRoles
      .mockReset()
      .mockReturnValue(["serviceid_serviceconfiguration"]);

    res.mockResetAll();
  });

  it("should display the confirmEditServiceInfo view", async () => {
    await getConfirmEditServiceInfo(req, res);

    expect(getServiceRaw.mock.calls).toHaveLength(1);
    expect(getServiceRaw).toHaveBeenCalledWith({
      by: { serviceId: "service-1" },
    });

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe(
      "services/views/confirmEditServiceInfo",
    );

    expect(getUserServiceRoles.mock.calls).toHaveLength(1);
    expect(getUserServiceRoles.mock.calls[0][0]).toMatchObject(req);
    expect(res.render.mock.calls[0][1]).toStrictEqual({
      backLink: "/services/service-1/service-information/edit",
      cancelLink: "/services/service-1/service-information",
      csrfToken: "token",
      currentNavigation: "",
      model: {
        description: "new-description-1",
        name: "new-name-1",
      },
      service: {
        id: "service-1",
        name: "service one",
        description: "service description",
      },
      serviceId: serviceId,
      userRoles: ["serviceid_serviceconfiguration"],
    });
  });

  it("should redirect to the service information page if there is no data in the session", async () => {
    req.session = {};
    await getConfirmEditServiceInfo(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/services/${req.params.sid}/service-information`,
    );
  });
});
