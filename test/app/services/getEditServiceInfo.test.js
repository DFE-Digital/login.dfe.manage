jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/infrastructure/applications");
jest.mock("../../../src/app/services/utils");

const { getRequestMock, getResponseMock } = require("../../utils");
const getEditServiceInfo = require("../../../src/app/services/getEditServiceInfo");
const { getServiceById } = require("../../../src/infrastructure/applications");
const { getUserServiceRoles } = require("../../../src/app/services/utils");

const res = getResponseMock();
const serviceId = "service-1";

describe("when getting the edit service info page", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service-1",
      },
      userServices: {
        roles: [
          {
            code: "serviceid_serviceconfiguration",
          },
        ],
      },
    });

    getServiceById.mockReset();
    getServiceById.mockReturnValue({
      id: "service-1",
      name: "service one",
      description: "service description",
      // Other fields would be present, but omitted for brevity
    });

    getUserServiceRoles
      .mockReset()
      .mockReturnValue(["serviceid_serviceconfiguration"]);

    res.mockResetAll();
  });

  it("should display the editServiceInfo view", async () => {
    await getEditServiceInfo(req, res);

    expect(getServiceById.mock.calls).toHaveLength(1);
    expect(getServiceById.mock.calls[0][0]).toBe("service-1");
    expect(getServiceById.mock.calls[0][1]).toBe("correlationId");

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/editServiceInfo");

    expect(getUserServiceRoles.mock.calls).toHaveLength(1);
    expect(getUserServiceRoles.mock.calls[0][0]).toMatchObject(req);
    expect(res.render.mock.calls[0][1]).toStrictEqual({
      backLink: "/services/service-1/service-information",
      cancelLink: "/services/service-1/service-information",
      csrfToken: "token",
      currentNavigation: "",
      model: {
        description: "service description",
        name: "service one",
        validationMessages: {},
      },
      service: {
        name: "service one",
      },
      serviceId: serviceId,
      userRoles: ["serviceid_serviceconfiguration"],
    });
  });
});
