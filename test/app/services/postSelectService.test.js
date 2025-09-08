const mockUtils = require("../../utils");

const mockConfig = mockUtils.configMockFactory();
const mockLogger = mockUtils.loggerMockFactory();

jest.mock("login.dfe.api-client/api/setup");
jest.mock("login.dfe.api-client/services", () => ({
  getServiceSummariesRaw: jest.fn(),
}));

jest.mock("./../../../src/infrastructure/config", () => mockConfig);
jest.mock("./../../../src/infrastructure/logger", () => mockLogger);

const { getRequestMock, getResponseMock } = require("../../utils");
const { getServiceSummariesRaw } = require("login.dfe.api-client/services");
const postSelectService =
  require("../../../src/app/services/selectService").post;

const res = getResponseMock();

describe("When selecting a service", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service1",
      },
      userServices: {
        roles: [
          {
            code: "serviceid_serviceconfiguration",
          },
        ],
      },
    });

    getServiceSummariesRaw.mockReset();
    getServiceSummariesRaw.mockReturnValue({
      services: [
        {
          id: "serviceid",
          name: "service one",
          description: "service one description",
        },
        {
          id: "serviceid1",
          name: "service two",
          description: "service two description",
        },
      ],
    });
    res.mockResetAll();
  });

  it("Then it should render a validation message if no service is selected", async () => {
    req.body.selectedService = undefined;

    await postSelectService(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/selectService");
    expect(res.render.mock.calls[0][1]).toHaveProperty("validationMessages", {
      selectedService: "Please select a service",
    });
  });

  it("Then it should render a validation message if selectedService is defined but is not in the services list", async () => {
    req.body.selectedService = "non-existant-id";

    await postSelectService(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/selectService");
    expect(res.render.mock.calls[0][1]).toHaveProperty("validationMessages", {
      selectedService: "Please select a service",
    });
  });

  it("Then it should redirect to the selected service dashboard if selectedService is defined and is in the services list", async () => {
    req.body.selectedService = "serviceid";
    await postSelectService(req, res);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/services/${req.body.selectedService}`,
    );
  });
});
