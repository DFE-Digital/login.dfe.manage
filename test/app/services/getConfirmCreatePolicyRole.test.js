jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.api-client/services");

const { getRequestMock, getResponseMock } = require("../../utils");
const getConfirmCreatePolicyRole = require("../../../src/app/services/getConfirmCreatePolicyRole");
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

describe("when using the getConfirmCreatePolicyRole function", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service-1",
        pid: "policy-1",
      },
      session: {
        createPolicyRoleData: {
          appId: "service-1",
          roleName: "Test Role",
          roleCode: "test_role",
          validationMessages: {},
        },
      },
    });

    getServicePolicyRaw.mockReset();
    getServicePolicyRaw.mockResolvedValue(policy);

    res.mockResetAll();
  });

  it("should return the confirmCreatePolicyRole view", async () => {
    await getConfirmCreatePolicyRole(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe(
      "services/views/confirmCreatePolicyRole",
    );
  });

  it("should include the following in the model on success", async () => {
    await getConfirmCreatePolicyRole(req, res);

    expect(res.render.mock.calls[0][1]).toStrictEqual({
      roleName: "Test Role",
      roleCode: "test_role",
      backLink: "/services/service-1/policies/policy-1/create-policy-role",
      cancelLink: "/services/service-1/policies/policy-1/create-policy-role",
      serviceId: "service-1",
      csrfToken: "token",
      currentNavigation: "policies",
      policy: policy,
    });
  });

  it("should redirect if the session is missing createPolicyRoleData", async () => {
    req.session = {};

    await getConfirmCreatePolicyRole(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("conditionsAndRoles");
  });
});
