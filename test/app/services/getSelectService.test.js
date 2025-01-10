const mockUtils = require("../../utils");

const mockConfig = mockUtils.configMockFactory();
const mockLogger = mockUtils.loggerMockFactory();

jest.mock("./../../../src/infrastructure/config", () => mockConfig);
jest.mock("./../../../src/infrastructure/logger", () => mockLogger);
jest.mock("./../../../src/infrastructure/applications");

const { getRequestMock, getResponseMock } = require("../../utils");
const getSelectService = require("../../../src/app/services/selectService").get;
const {
  getServiceSummaries,
} = require("../../../src/infrastructure/applications");

const res = getResponseMock();

describe("When going to the select-service page", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      session: {
        passport: {
          user: {
            sub: "user_id_uuid",
          },
        },
      },
      userServices: {
        roles: [
          {
            code: "serviceid_serviceconfig",
          },
          {
            code: "serviceid1_serviceconfig",
          },
        ],
      },
    });

    getServiceSummaries.mockReset();
    getServiceSummaries.mockReturnValue({
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

  it("Then it should get the necessary service information with one request if the user has <=33 unique services", async () => {
    await getSelectService(req, res);

    expect(getServiceSummaries.mock.calls).toHaveLength(1);
    expect(getServiceSummaries.mock.calls[0][0]).toStrictEqual([
      "serviceid",
      "serviceid1",
    ]);
    expect(getServiceSummaries.mock.calls[0][1]).toStrictEqual([
      "id",
      "name",
      "description",
    ]);
    expect(getServiceSummaries.mock.calls[0][2]).toBe("correlationId");
  });

  it("Then it should get the necessary service information with multiple requests if the user has > 33 unique services", async () => {
    const requestedIds = new Array(45)
      .fill(null)
      .map((_, index) => `serviceId${index}`);

    req.userServices = {
      roles: requestedIds.map((id) => ({ code: `${id}_serviceconfig` })),
    };
    await getSelectService(req, res);

    expect(getServiceSummaries.mock.calls).toHaveLength(2);
    expect(getServiceSummaries.mock.calls[0][0]).toStrictEqual(
      requestedIds.slice(0, 33),
    );
    expect(getServiceSummaries.mock.calls[1][0]).toStrictEqual(
      requestedIds.slice(33),
    );
    expect(getServiceSummaries.mock.calls[0][1]).toStrictEqual([
      "id",
      "name",
      "description",
    ]);
    expect(getServiceSummaries.mock.calls[1][1]).toStrictEqual([
      "id",
      "name",
      "description",
    ]);
    expect(getServiceSummaries.mock.calls[0][2]).toBe("correlationId");
    expect(getServiceSummaries.mock.calls[1][2]).toBe("correlationId");
  });

  it("Then it should log and throw an error if no active services could be found for the user", async () => {
    const userServicesIds = new Set(
      req.userServices.roles.map((role) =>
        role.code.substr(0, role.code.indexOf("_")),
      ),
    );
    const expectedMessage = `No manage services found with IDs [${[...userServicesIds].join()}]`;

    getServiceSummaries.mockReturnValue(null);

    await expect(async () => getSelectService(req, res)).rejects.toThrow(
      `${expectedMessage}, correlation ID ${req.id}`,
    );
    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error.mock.calls[0][0]).toBe(expectedMessage);
    expect(mockLogger.error.mock.calls[0][1]).toStrictEqual({
      correlationId: req.id,
    });
  });

  it("Then it should redirect to the service dashboard if the user only has one active service", async () => {
    req.userServices = {
      roles: [
        {
          code: "serviceid_serviceconfig",
        },
      ],
    };
    getServiceSummaries.mockReturnValue({
      id: "serviceid",
      name: "service one",
      description: "service one description",
    });
    await getSelectService(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("serviceid");
  });

  it("Then it should return the selectService view if the user has more than one active service", async () => {
    await getSelectService(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/selectService");
  });

  it("Then it should include csrf token in model", async () => {
    await getSelectService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
    });
  });

  it("Then it should include the service details in the model", async () => {
    await getSelectService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
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
  });
});
