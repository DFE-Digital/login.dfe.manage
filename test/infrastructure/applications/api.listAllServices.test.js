jest.mock("login.dfe.async-retry");
jest.mock("login.dfe.jwt-strategies");
jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory({
    applications: {
      type: "api",
      service: {
        url: "http://applications.test",
      },
    },
  }),
);

const { fetchApi } = require("login.dfe.async-retry");
const jwtStrategy = require("login.dfe.jwt-strategies");
const {
  listAllServices,
} = require("../../../src/infrastructure/applications/api");

const correlationId = "abc123";
const apiResponse = {
  name: "Test name",
  email: "test@example.com",
};

describe("when running the listAllServices function", () => {
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

  it("should call invitations resource with user id", async () => {
    await listAllServices(correlationId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://applications.test/services?pageSize=1000",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "GET",
    });
  });

  it("should use the token from jwt strategy as bearer token", async () => {
    await listAllServices(correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: "bearer token",
      },
    });
  });

  it("should include the correlation id", async () => {
    await listAllServices(correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        "x-correlation-id": correlationId,
      },
    });
  });

  it("should return null on a 404 response", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("not found");
      error.statusCode = 404;
      throw error;
    });

    const result = await listAllServices(correlationId);
    expect(result).toEqual(null);
  });

  it("should raise an exception on any failure status code that is not 404", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("Server Error");
      error.statusCode = 500;
      throw error;
    });

    try {
      await listAllServices(correlationId);
    } catch (e) {
      expect(e.statusCode).toEqual(500);
      expect(e.message).toEqual("Server Error");
    }
  });
});
