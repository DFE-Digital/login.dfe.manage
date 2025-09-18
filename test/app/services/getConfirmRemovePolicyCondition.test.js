jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.api-client/services");

const { getRequestMock, getResponseMock } = require("../../utils");
const getConfirmRemovePolicyCondition = require("../../../src/app/services/getConfirmRemovePolicyCondition");
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

describe("when using the getConfirmRemovePolicyCondition function", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service-1",
        pid: "policy-1",
      },
      query: {
        condition: "organisation.urn",
        operator: "is",
        value: "123456",
      },
      userServices: {
        roles: [
          {
            id: "E6B7C861-7D76-4D75-BA23-26E4A89B9E4E",
            name: "Test service - Service Configuration",
            code: "service-1_serviceconfig",
            numericId: "23413",
            status: { id: 1 },
          },
        ],
      },
      session: {
        createPolicyConditionData: {
          condition: "organisation.urn",
          operator: "is",
          value: "123456",
          validationMessages: {},
        },
      },
    });

    getServicePolicyRaw.mockReset();
    getServicePolicyRaw.mockReturnValue(policy);

    res.mockResetAll();
  });

  it("should return the confirmRemovePolicyCondition view", async () => {
    await getConfirmRemovePolicyCondition(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe(
      "services/views/confirmRemovePolicyCondition",
    );
  });

  it("should include csrf token in model", async () => {
    await getConfirmRemovePolicyCondition(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
    });
  });

  it("should include the following in the model on success", async () => {
    await getConfirmRemovePolicyCondition(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      condition: "organisation.urn",
      operator: "is",
      value: "123456",
      friendlyField: "Organisation URN",
      friendlyValue: ["123456"],
      backLink: "/services/service-1/policies/policy-1/conditionsAndRoles",
      cancelLink: "/services/service-1/policies/policy-1/conditionsAndRoles",
      csrfToken: "token",
      currentNavigation: "policies",
      policy: policy,
      userRoles: ["serviceconfig"],
    });
  });
});
