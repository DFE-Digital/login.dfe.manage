jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/infrastructure/applications");
jest.mock("../../../src/app/services/utils");

const { getRequestMock, getResponseMock } = require("../../utils");
const postEditServiceInfo = require("../../../src/app/services/postEditServiceInfo");
const {
  getServiceById,
  listAllServices,
} = require("../../../src/infrastructure/applications");
const { getUserServiceRoles } = require("../../../src/app/services/utils");

const res = getResponseMock();

const listAllServicesResponse = {
  services: [
    {
      id: "service-1",
      name: "service one",
      description: "service description",
    },
    {
      id: "service-2",
      name: "service two",
      description: "service description two",
    },
  ],
};

describe("when getting the post edit service info page", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service-1",
      },
      body: {
        name: "new-service-name",
        description: "existing-service-description",
      },
      session: {
        save: jest.fn((cb) => cb()),
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

    listAllServices.mockReset();
    listAllServices.mockReturnValue(listAllServicesResponse);

    getUserServiceRoles
      .mockReset()
      .mockReturnValue(["serviceid_serviceconfiguration"]);

    res.mockResetAll();
  });

  it("should redirect to the confirm page on success", async () => {
    await postEditServiceInfo(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("edit/confirm");
  });

  it("should display the editServiceInfo view with an error if the name is empty", async () => {
    req.body.name = "";
    await postEditServiceInfo(req, res);

    expect(getServiceById.mock.calls).toHaveLength(1);
    expect(getServiceById.mock.calls[0][0]).toBe("service-1");
    expect(getServiceById.mock.calls[0][1]).toBe("correlationId");

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/editServiceInfo");
  });

  it("should render an error when the session.save fails", async () => {
    req.session = {
      save: jest.fn((cb) => cb("Something went wrong")),
    };

    await postEditServiceInfo(req, res);

    expect(res.render.mock.calls[0][1].model.validationMessages).toMatchObject({
      name: "Something went wrong submitting data, please try again",
    });
  });
});
