jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);

jest.mock("login.dfe.api-client/services");

const { getRequestMock, getResponseMock } = require("../../utils");
const postCreatePolicyRole = require("../../../src/app/services/postCreatePolicyRole");
const { getServicePolicyRaw } = require("login.dfe.api-client/services");
const res = getResponseMock();

const policy = {
  id: "6C8172B6-011B-4526-B04D-E2809A3D71A2",
  name: "Test Service - Test Policy",
  applicationId: "32A923EE-B729-44B1-BB52-1789FD08862A",
  status: { id: 1 },
  conditions: [
    { field: "organisation.status.id", operator: "is", value: ["1", "3", "4"] },
    { field: "organisation.type.id", operator: "is", value: ["57"] },
    {
      field: "organisation.category.id",
      operator: "is",
      value: ["001"],
    },
  ],
  roles: [
    {
      id: "717E2ECB-8B76-402C-A142-15DD486CBE95",
      name: "School",
      code: "CheckRecord_School",
      numericId: "22997",
      status: ["1"],
    },
  ],
};

describe("when using postCreatePolicyRole", () => {
  let req;

  beforeEach(() => {
    const requestBody = {
      params: {
        sid: "service-id",
        pid: "policy-id",
      },
      body: {
        roleName: "test name",
        roleCode: "test-code",
      },
      session: {
        save: jest.fn((cb) => cb()),
      },
    };

    req = getRequestMock(requestBody);

    getServicePolicyRaw.mockReset();
    getServicePolicyRaw.mockResolvedValue(policy);

    res.mockResetAll();
  });

  it("should redirect to the confirm page on success", async () => {
    await postCreatePolicyRole(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("confirm-create-policy-role");
  });

  it("should return a validation error when the role name is missing", async () => {
    req.body.roleName = "";

    await postCreatePolicyRole(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: "/services/service-id/policies/policy-id/conditionsAndRoles",
      cancelLink: "/services/service-id/policies/policy-id/conditionsAndRoles",
      serviceId: "service-id",
      csrfToken: "token",
      currentNavigation: "policies",
      policy: policy,
      validationMessages: { roleName: "Please enter a role name" },
    });
  });

  it("should return a validation error when the role code is missing", async () => {
    req.body.roleCode = "";

    await postCreatePolicyRole(req, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      roleCode: "Please enter a role code",
    });
  });

  it("should return a validation error when the role name exceeds 125 characters", async () => {
    req.body.roleName = "a".repeat(126);

    await postCreatePolicyRole(req, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      roleName: "Role name must be 125 characters or less",
    });
  });

  it("should return a validation error when the role code exceeds 50 characters", async () => {
    req.body.roleCode = "a".repeat(51);

    await postCreatePolicyRole(req, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      roleCode: "Role code must be 50 characters or less",
    });
  });

  it("should return a validation error when the role already exists in the policy", async () => {
    req.body.roleName = "School";
    req.body.roleCode = "CheckRecord_School";

    await postCreatePolicyRole(req, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      roleExists: "This role already exists for this policy",
    });
  });

  it("should render an error when the session.save fails", async () => {
    req.session = {
      save: jest.fn((cb) => cb("Something went wrong")),
    };

    await postCreatePolicyRole(req, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      role: "Something went wrong submitting data, please try again",
    });
  });

  it("should save the role data to session on successful validation", async () => {
    await postCreatePolicyRole(req, res);

    expect(req.session.createPolicyRoleData).toMatchObject({
      appId: "service-id",
      roleName: "test name",
      roleCode: "test-code",
      validationMessages: {},
    });
  });
});
