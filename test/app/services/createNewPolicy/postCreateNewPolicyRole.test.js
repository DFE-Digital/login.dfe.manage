jest.mock("./../../../../src/infrastructure/config", () =>
  require("../../../utils").configMockFactory(),
);
jest.mock("./../../../../src/infrastructure/logger", () =>
  require("../../../utils").loggerMockFactory(),
);

jest.mock("login.dfe.api-client/services");

const { getRequestMock, getResponseMock } = require("../../../utils");
const postCreateNewPolicyRole = require("../../../../src/app/services/createNewPolicy/postCreateNewPolicyRole");
const { getServiceRaw } = require("login.dfe.api-client/services");
const res = getResponseMock();

// Fields removed for brevity.
const service = {
  id: "service1",
  name: "Service One",
};

describe("when using postCreateNewPolicyRole", () => {
  let req;

  beforeEach(() => {
    const requestBody = {
      params: {
        sid: "service-1",
      },
      body: {
        roleName: "test name",
        roleCode: "test-code",
      },
      session: {
        createNewPolicy: {
          name: "Test policy",
        },
        save: jest.fn((cb) => cb()),
      },
    };

    req = getRequestMock(requestBody);

    getServiceRaw.mockReset();
    getServiceRaw.mockResolvedValue(service);

    res.mockResetAll();
  });

  // This will redirect to the conditions page once implemented
  it("should redirect to the policies page on success", async () => {
    await postCreateNewPolicyRole(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("create-new-policy-condition");
  });

  it("should trim whitespace from role name before validation", async () => {
    req.body.roleName = "  test name  ";

    await postCreateNewPolicyRole(req, res);

    expect(req.session.createNewPolicy).toMatchObject({
      name: "Test policy",
      role: {
        roleName: "test name",
        roleCode: "test-code",
        validationMessages: {},
      },
    });
    expect(res.redirect.mock.calls[0][0]).toBe("create-new-policy-condition");
  });

  it("should trim whitespace from role code before validation", async () => {
    req.body.roleCode = "  test-code  ";

    await postCreateNewPolicyRole(req, res);

    expect(req.session.createNewPolicy).toMatchObject({
      name: "Test policy",
      role: {
        roleName: "test name",
        roleCode: "test-code",
        validationMessages: {},
      },
    });
    expect(res.redirect.mock.calls[0][0]).toBe("create-new-policy-condition");
  });

  it("should return validation error when role name is only whitespace", async () => {
    req.body.roleName = "   ";

    await postCreateNewPolicyRole(req, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      roleName: "Please enter a role name",
    });
  });

  it("should return validation error when role code is only whitespace", async () => {
    req.body.roleCode = "   ";

    await postCreateNewPolicyRole(req, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      roleCode: "Please enter a role code",
    });
  });

  it("should trim whitespace before checking role name length", async () => {
    req.body.roleName = "  " + "a".repeat(125) + "  ";

    await postCreateNewPolicyRole(req, res);

    expect(req.session.createNewPolicy.role.roleName).toBe("a".repeat(125));
    expect(res.redirect.mock.calls[0][0]).toBe("create-new-policy-condition");
  });

  it("should trim whitespace before checking role code length", async () => {
    req.body.roleCode = "  " + "a".repeat(50) + "  ";

    await postCreateNewPolicyRole(req, res);

    expect(req.session.createNewPolicy.role.roleCode).toBe("a".repeat(50));
    expect(res.redirect.mock.calls[0][0]).toBe("create-new-policy-condition");
  });

  it("should return a validation error when the role name is missing", async () => {
    req.body.roleName = "";

    await postCreateNewPolicyRole(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      policyName: "Test policy",
      backLink: `/services/service-1/policies/create-new-policy-name`,
      cancelLink: `/services/service-1/policies`,
      serviceId: "service-1",
      csrfToken: "token",
      currentNavigation: "policies",
      roleName: "",
      roleCode: "test-code",
      validationMessages: {
        roleName: "Please enter a role name",
      },
    });
  });

  it("should return a validation error when the role code is missing", async () => {
    req.body.roleCode = "";

    await postCreateNewPolicyRole(req, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      roleCode: "Please enter a role code",
    });
  });

  it("should return a validation error when the role name exceeds 125 characters", async () => {
    req.body.roleName = "a".repeat(126);

    await postCreateNewPolicyRole(req, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      roleName: "Role name must be 125 characters or less",
    });
  });

  it("should return a validation error when the role code exceeds 50 characters", async () => {
    req.body.roleCode = "a".repeat(51);

    await postCreateNewPolicyRole(req, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      roleCode: "Role code must be 50 characters or less",
    });
  });

  it("should render an error when the session.save fails", async () => {
    req.session = {
      createNewPolicy: { name: "Test policy" },
      save: jest.fn((cb) => cb("Something went wrong")),
    };

    await postCreateNewPolicyRole(req, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      roleName: "Something went wrong submitting data, please try again",
    });
  });

  it("should save the role data to session on successful validation", async () => {
    await postCreateNewPolicyRole(req, res);

    expect(req.session.createNewPolicy).toMatchObject({
      name: "Test policy",
      role: {
        roleName: "test name",
        roleCode: "test-code",
        validationMessages: {},
      },
    });
  });
});
