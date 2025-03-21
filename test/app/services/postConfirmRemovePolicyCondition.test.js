jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/infrastructure/access");

const { getRequestMock, getResponseMock } = require("../../utils");
const postConfirmRemovePolicyCondition = require("../../../src/app/services/postConfirmRemovePolicyCondition");
const {
  getPolicyById,
  updatePolicyById,
} = require("../../../src/infrastructure/access");
const res = getResponseMock();

const policy = {
  id: "6C8172B6-011B-4526-B04D-E2809A3D71A2",
  name: "Test Service - Test Policy",
  applicationId: "32A923EE-B729-44B1-BB52-1789FD08862A",
  status: { id: 1 },
  conditions: [
    { field: "organisation.status.id", operator: "is", value: ["1", "3", "4"] },
    { field: "organisation.type.id", operator: "is", value: ["57"] },
    { field: "organisation.category.id", operator: "is", value: ["001"] },
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

const requestBody = {
  params: {
    sid: "service-1",
    pid: "policy-1",
  },
  body: {
    condition: "organisation.type.id",
    operator: "is",
    value: "57",
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
      {
        id: "E6B7C861-7D76-4D75-BA23-26E4A89B9E4E",
        name: "Manage - Add policy condition",
        code: "manageAddPolicyCondition",
        numericId: "23413",
        status: { id: 1 },
      },
    ],
  },
};

describe("when using the postConfirmRemovePolicyCondition function", () => {
  let req;

  beforeEach(() => {
    const clonedRequestBody = structuredClone(requestBody);
    req = getRequestMock(clonedRequestBody);

    const clonedPolicy = structuredClone(policy);
    getPolicyById.mockReset();
    getPolicyById.mockReturnValue(clonedPolicy);

    updatePolicyById.mockReset();
    updatePolicyById.mockReturnValue(undefined);

    res.mockResetAll();
  });

  it("should redirect if the user doesn't have the correct permissions", async () => {
    req.userServices.roles = [
      {
        id: "E6B7C861-7D76-4D75-BA23-26E4A89B9E4E",
        name: "Test service - Service Configuration",
        code: "service-1_serviceconfig",
        numericId: "23413",
        status: { id: 1 },
      },
    ];
    await postConfirmRemovePolicyCondition(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("conditionsAndRoles");
  });

  it("should remove a policy condition entirely when only 1 value in array", async () => {
    await postConfirmRemovePolicyCondition(req, res);
    // 3 unique conditions in the mocked policy. Should be 2 after we remove condition
    expect(updatePolicyById.mock.calls[0][2].conditions.length).toBe(2);
    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("conditionsAndRoles");
  });

  it("should create a new policy condition when the condition does not already exist", async () => {
    const testReq = getRequestMock(requestBody);
    testReq.body.condition = "organisation.status.id";
    testReq.body.value = "1";
    await postConfirmRemovePolicyCondition(testReq, res);

    // 3 unique conditions in the mocked policy. Should remain 3 as the new value should be removed
    // from the existing array
    expect(updatePolicyById.mock.calls[0][2].conditions.length).toBe(3);
    const testCondition = updatePolicyById.mock.calls[0][2].conditions.find(
      (condition) => condition.field === "organisation.status.id",
    );
    expect(testCondition.value).toStrictEqual(["3", "4"]);
    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("conditionsAndRoles");
  });

  it("should log a message and do nothing if the value does not exist", async () => {
    const testReq = getRequestMock(requestBody);
    testReq.body.value = "10000";
    await postConfirmRemovePolicyCondition(testReq, res);

    expect(updatePolicyById.mock.calls[0][2].conditions.length).toBe(3);
    const testCondition = updatePolicyById.mock.calls[0][2].conditions.find(
      (condition) => condition.field === "organisation.type.id",
    );
    // Should remain untouched if value doesn't match an existing value
    expect(testCondition.value).toStrictEqual(["57"]);
    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("conditionsAndRoles");
  });
});
