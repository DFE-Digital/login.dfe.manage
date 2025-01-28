jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/infrastructure/access");

const { getRequestMock, getResponseMock } = require("../../utils");
const postCreatePolicyCondition = require("../../../src/app/services/postCreatePolicyCondition");
const { getPolicyById } = require("../../../src/infrastructure/access");
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

const requestBody = {
  params: {
    sid: "service-1",
    pid: "policy-1",
  },
  body: {
    condition: "organisation.urn",
    operator: "is",
    value: "123456",
  },
  session: {
    save: jest.fn((cb) => cb()),
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
    req = getRequestMock(requestBody);

    getPolicyById.mockReset();
    getPolicyById.mockReturnValue(policy);

    res.mockResetAll();
  });

  it("then it should return the service banners view", async () => {
    await postCreatePolicyCondition(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      "confirm-create-policy-condition",
    );
  });

  it("should return a validation error when the condition is missing", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "";
    const testReq = getRequestMock(testRequestBody);

    await postCreatePolicyCondition(testReq, res);

    // The first test will show everything in the render call.  Subsequent tests
    // will just ensure the validationMessages are correct
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: "/services/service-1/policies/policy-1/conditionsAndRoles",
      cancelLink: "/services/service-1/policies/policy-1/conditionsAndRoles",
      csrfToken: "token",
      currentNavigation: "policies",
      policy: policy,
      userRoles: ["serviceconfig"],
      validationMessages: { condition: "Please enter a condition" },
    });
  });

  it("should return a validation error when the operator is missing", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.operator = "";
    const testReq = getRequestMock(testRequestBody);

    await postCreatePolicyCondition(testReq, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      operator: "Please enter an operator",
    });
  });

  it("should return a validation error when the value is missing", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.value = "";
    const testReq = getRequestMock(testRequestBody);

    await postCreatePolicyCondition(testReq, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      value: "Please enter a value",
    });
  });

  it("should return a validation error when the urn is incorrect", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.urn";
    testRequestBody.body.value = "12345678";
    const testReq = getRequestMock(testRequestBody);

    await postCreatePolicyCondition(testReq, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      value: "organisation.urn can only be a 6 digit number",
    });
  });

  it("should return a validation error when the urn is incorrect", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.ukprn";
    testRequestBody.body.value = "1234567890";
    const testReq = getRequestMock(testRequestBody);

    await postCreatePolicyCondition(testReq, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      value: "organisation.ukprn can only be an 8 digit number",
    });
  });
});
