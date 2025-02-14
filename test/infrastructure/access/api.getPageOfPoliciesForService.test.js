jest.mock("login.dfe.async-retry");
jest.mock("login.dfe.jwt-strategies");
jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory({
    access: {
      type: "api",
      service: {
        url: "http://access.test",
      },
    },
  }),
);

const { fetchApi } = require("login.dfe.async-retry");
const jwtStrategy = require("login.dfe.jwt-strategies");
const {
  getPageOfPoliciesForService,
} = require("../../../src/infrastructure/access/api");

const serviceId = "service-1";
const page = 1;
const pageSize = 20;
const correlationId = "abc123";
const apiResponse = {};

describe("when getting a users organisations mapping from api", () => {
  beforeEach(() => {
    fetchApi.mockReset();
    fetchApi.mockImplementation(() => {
      return apiResponse;
    });

    jwtStrategy.mockReset();
    jwtStrategy.mockImplementation(() => {
      return {
        getBearerToken: jest.fn().mockReturnValue("token"),
      };
    });
  });

  it("then it should call associated-with-user resource with user id", async () => {
    await getPageOfPoliciesForService(serviceId, page, pageSize, correlationId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://access.test/services/v2/service-1/policies?page=1&pageSize=20",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "GET",
    });
  });

  it("then it should use the token from jwt strategy as bearer token", async () => {
    await getPageOfPoliciesForService(serviceId, page, pageSize, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: "bearer token",
      },
    });
  });

  it("then it should include the correlation id", async () => {
    await getPageOfPoliciesForService(serviceId, page, pageSize, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        "x-correlation-id": correlationId,
      },
    });
  });

  it("should return undefined on a 404 response", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("not found");
      error.statusCode = 404;
      throw error;
    });

    const result = await getPageOfPoliciesForService(
      serviceId,
      page,
      pageSize,
      correlationId,
    );
    expect(result).toEqual(undefined);
  });

  it("should raise an exception on any failure status code that is not 404", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("Server Error");
      error.statusCode = 500;
      throw error;
    });

    try {
      await getPageOfPoliciesForService(
        serviceId,
        page,
        pageSize,
        correlationId,
      );
    } catch (e) {
      expect(e.statusCode).toEqual(500);
      expect(e.message).toEqual("Server Error");
    }
  });
});
