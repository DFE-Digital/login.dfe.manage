jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/infrastructure/access");

const { getRequestMock, getResponseMock } = require("../../utils");
const postConfirmCreatePolicyCondition = require("../../../src/app/services/postConfirmCreatePolicyCondition");
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
  session: {
    createPolicyConditionData: {
      condition: "organisation.urn",
      operator: "is",
      value: "123456",
    },
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
};

describe("when getting the list of service banners page", () => {
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

  it("should create a new policy condition when the condition does not already exist", async () => {
    await postConfirmCreatePolicyCondition(req, res);
    // 3 unique conditions in the mocked policy. Should be 4 after we added another unique condition.
    expect(updatePolicyById.mock.calls[0][2].conditions.length).toBe(4);
    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("conditionsAndRoles");
  });

  it("should create a new policy condition when the condition does not already exist", async () => {
    const testReq = getRequestMock(requestBody);
    testReq.session.createPolicyConditionData.condition =
      "organisation.category.id";
    testReq.session.createPolicyConditionData.value = "002";
    await postConfirmCreatePolicyCondition(testReq, res);

    // 3 unique conditions in the mocked policy. Should remain 3 as the new value should be added to an
    // existing one
    expect(updatePolicyById.mock.calls[0][2].conditions.length).toBe(3);
    const testCondition = updatePolicyById.mock.calls[0][2].conditions.find(
      (condition) => condition.field === "organisation.category.id",
    );
    expect(testCondition.value).toStrictEqual(["001", "002"]);
    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("conditionsAndRoles");
  });
});
