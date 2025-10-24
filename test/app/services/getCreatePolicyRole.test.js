jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.api-client/services");

const { getRequestMock, getResponseMock } = require("../../utils");
const getCreatePolicyRole = require("../../../src/app/services/getCreatePolicyRole");
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

describe("when calling the getCreatePolicyRole function", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service-id",
        pid: "policy-id",
      },
    });

    getServicePolicyRaw.mockReset();
    getServicePolicyRaw.mockResolvedValue(policy);

    res.mockResetAll();
  });

  it("should return the createPolicyRole view", async () => {
    await getCreatePolicyRole(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/createPolicyRole");
  });

  it("should include the following in the model on success", async () => {
    await getCreatePolicyRole(req, res);

    expect(res.render.mock.calls[0][1]).toStrictEqual({
      backLink: "/services/service-id/policies/policy-id/conditionsAndRoles",
      cancelLink: "/services/service-id/policies/policy-id/conditionsAndRoles",
      serviceId: "service-id",
      csrfToken: "token",
      currentNavigation: "policies",
      policy: policy,
      validationMessages: {},
    });
  });

  it("should call getServicePolicyRaw with the correct parameters", async () => {
    await getCreatePolicyRole(req, res);

    expect(getServicePolicyRaw).toHaveBeenCalledWith({
      serviceId: "service-id",
      policyId: "policy-id",
    });
  });
});
