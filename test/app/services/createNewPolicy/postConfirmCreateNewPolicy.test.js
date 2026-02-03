jest.mock("../../../../src/infrastructure/config", () =>
  require("../../../utils").configMockFactory(),
);
const mockUtils = require("../../../utils");
const mockLogger = mockUtils.loggerMockFactory();
jest.mock("../../../../src/infrastructure/logger", () => mockLogger);

jest.mock("login.dfe.api-client/services");

const { getRequestMock, getResponseMock } = require("../../../utils");
const {
  createServicePolicy,
  createServiceRole,
  getServiceRolesRaw,
} = require("login.dfe.api-client/services");
const postConfirmCreateNewPolicy = require("../../../../src/app/services/createNewPolicy/postConfirmCreateNewPolicy");
const res = getResponseMock();

describe("when calling the postConfirmCreateNewPolicy function", () => {
  let req;

  const createPolicyResponse = {
    id: "policy-1",
  };

  const createRoleResponse = {
    id: "role-1",
  };

  const getServiceRolesResponse = [
    { id: "role-1", name: "Test role", code: "Test code" },
    { id: "role-2", name: "Role two", code: "Role two code" },
  ];

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service-1",
      },
      session: {
        createNewPolicy: {
          name: "Test Policy",
          role: {
            roleName: "Test role",
            roleCode: "Test code",
          },
          condition: {
            condition: "organisation.urn",
            operator: "is",
            value: "123456",
          },
        },
      },
    });

    res.mockResetAll();

    createServiceRole.mockReset();
    createServiceRole.mockResolvedValue(createRoleResponse);

    createServicePolicy.mockReset();
    createServicePolicy.mockResolvedValue(createPolicyResponse);

    getServiceRolesRaw.mockReset();
    getServiceRolesRaw.mockResolvedValue(getServiceRolesResponse);
  });

  it("should flash and then redirect on success when newly creating a role", async () => {
    await postConfirmCreateNewPolicy(req, res);

    expect(mockLogger.info).toHaveBeenCalledTimes(2);
    expect(mockLogger.info.mock.calls[0][0]).toBe(
      "New role created with id [role-1]",
    );
    expect(mockLogger.info.mock.calls[1][0]).toBe(
      "New policy created with id [policy-1]",
    );
    expect(res.flash.mock.calls.length).toBe(1);
    expect(res.flash.mock.calls[0][0]).toBe("info");
    expect(res.flash.mock.calls[0][1]).toBe(
      "'Test Policy' policy was successfully created",
    );
    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`/services/service-1/policies`);
  });

  it("should flash and then redirect on success when role exists", async () => {
    createServiceRole.mockImplementation(() => {
      const error = new Error("Role already exists");
      error.statusCode = 409;
      throw error;
    });
    await postConfirmCreateNewPolicy(req, res);

    expect(getServiceRolesRaw.mock.calls.length).toBe(1);

    expect(mockLogger.info).toHaveBeenCalledTimes(2);
    expect(mockLogger.info.mock.calls[0][0]).toBe(
      "Role with name [Test role] and code [Test code] exists.  Finding id for role.",
    );
    expect(mockLogger.info.mock.calls[1][0]).toBe(
      "New policy created with id [policy-1]",
    );
    expect(res.flash.mock.calls.length).toBe(1);
    expect(res.flash.mock.calls[0][0]).toBe("info");
    expect(res.flash.mock.calls[0][1]).toBe(
      "'Test Policy' policy was successfully created",
    );
    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`/services/service-1/policies`);
  });

  it("should log an error, flash a message and redirect on createServicePolicy failure", async () => {
    const errorMessage = "Error creating policy";
    const error = new Error(errorMessage);
    createServicePolicy.mockImplementation(() => {
      throw error;
    });
    await postConfirmCreateNewPolicy(req, res);

    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error.mock.calls[0][0]).toBe(
      "Something went wrong creating the policy",
    );
    expect(mockLogger.error.mock.calls[0][1]).toBe(error);
    expect(res.flash.mock.calls.length).toBe(1);
    expect(res.flash.mock.calls[0][0]).toBe("error");
    expect(res.flash.mock.calls[0][1]).toBe(
      "Something went wrong creating the policy",
    );
    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`/services/service-1/policies`);
  });

  it("should log an error, flash a message and redirect on createServiceRole failure", async () => {
    const errorMessage = "Error creating policy";
    const error = new Error(errorMessage);
    createServiceRole.mockImplementation(() => {
      throw error;
    });
    await postConfirmCreateNewPolicy(req, res);

    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error.mock.calls[0][0]).toBe(
      "Something went wrong creating the role",
    );
    expect(mockLogger.error.mock.calls[0][1]).toBe(error);
    expect(res.flash.mock.calls.length).toBe(1);
    expect(res.flash.mock.calls[0][0]).toBe("error");
    expect(res.flash.mock.calls[0][1]).toBe(
      "Something went wrong creating the policy",
    );
    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`/services/service-1/policies`);
  });

  it("should log an error, flash a message and redirect on getServiceRolesRaw failure", async () => {
    createServiceRole.mockImplementation(() => {
      const error = new Error("Role already exists");
      error.statusCode = 409;
      throw error;
    });

    const errorMessage = "Error creating policy";
    const error = new Error(errorMessage);
    getServiceRolesRaw.mockImplementation(() => {
      throw error;
    });
    await postConfirmCreateNewPolicy(req, res);

    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error.mock.calls[0][0]).toBe(
      "Something went wrong getting the service roles",
    );
    expect(mockLogger.error.mock.calls[0][1]).toBe(error);
    expect(res.flash.mock.calls.length).toBe(1);
    expect(res.flash.mock.calls[0][0]).toBe("error");
    expect(res.flash.mock.calls[0][1]).toBe(
      "Something went wrong creating the policy",
    );
    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`/services/service-1/policies`);
  });

  it("should redirect to policies if there is no data in the session", async () => {
    req = getRequestMock({
      params: {
        sid: "service-1",
      },
    });
    await postConfirmCreateNewPolicy(req, res);

    expect(res.redirect.mock.calls[0][0]).toBe("/services/service-1/policies");
  });
});
