jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);

jest.mock("login.dfe.api-client/organisations");
jest.mock("login.dfe.api-client/services");

const { getRequestMock, getResponseMock } = require("../../utils");
const postCreatePolicyCondition = require("../../../src/app/services/postCreatePolicyCondition");
const { getServicePolicyRaw } = require("login.dfe.api-client/services");
const { getOrganisationRaw } = require("login.dfe.api-client/organisations");
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

const organisation = {
  name: "Test name",
  address: "Test address",
  ukprn: "12345678",
  category: {
    id: "008",
  },
  upin: "123456",
  urn: "123456",
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

describe("when posting the create policy condition page", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock(requestBody);

    getServicePolicyRaw.mockReset();
    getServicePolicyRaw.mockReturnValue(policy);

    getOrganisationRaw.mockReset();
    getOrganisationRaw.mockResolvedValue(organisation);

    res.mockResetAll();
  });

  it("should redirect to the confirm page on success", async () => {
    await postCreatePolicyCondition(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      "confirm-create-policy-condition",
    );
  });

  it("should redirect to the confirm page on success with ukprn", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.ukprn";
    testRequestBody.body.value = "12345678";
    testRequestBody.session = { save: jest.fn((cb) => cb()) };
    const testReq = getRequestMock(testRequestBody);

    await postCreatePolicyCondition(testReq, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      "confirm-create-policy-condition",
    );
  });

  it("should redirect to the confirm page on success with type", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.type.id";
    testRequestBody.body.value = "11";
    testRequestBody.session = { save: jest.fn((cb) => cb()) };
    const testReq = getRequestMock(testRequestBody);

    await postCreatePolicyCondition(testReq, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      "confirm-create-policy-condition",
    );
  });

  it("should redirect to the confirm page on success with status", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.status.id";
    testRequestBody.body.value = "11";
    testRequestBody.session = { save: jest.fn((cb) => cb()) };
    const testReq = getRequestMock(testRequestBody);

    await postCreatePolicyCondition(testReq, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      "confirm-create-policy-condition",
    );
  });

  it("should redirect to the confirm page on success with id that exists", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.id";
    testRequestBody.body.value = "09001145-f018-45fc-be3f-ce7ff21b7db3";
    testRequestBody.session = { save: jest.fn((cb) => cb()) };
    const testReq = getRequestMock(testRequestBody);

    await postCreatePolicyCondition(testReq, res);

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

  it("should return a validation error when the id is incorrect", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.id";
    testRequestBody.body.value = "not-a-uuid";
    const testReq = getRequestMock(testRequestBody);

    await postCreatePolicyCondition(testReq, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      value: "organisation.id needs to be a valid uuid",
    });
  });

  it("should return a validation error when the type is incorrect", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.type.id";
    testRequestBody.body.value = "1234";
    const testReq = getRequestMock(testRequestBody);

    await postCreatePolicyCondition(testReq, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      value: "organisation.type.id can only be a 2 digit number",
    });
  });

  it("should return a validation error when the status is incorrect", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.status.id";
    testRequestBody.body.value = "1234";
    const testReq = getRequestMock(testRequestBody);

    await postCreatePolicyCondition(testReq, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      value: "organisation.status.id can only be a 1 or 2 digit number",
    });
  });

  it("should return a validation error when the category is incorrect", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.category.id";
    testRequestBody.body.value = "1234";
    const testReq = getRequestMock(testRequestBody);

    await postCreatePolicyCondition(testReq, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      value: "organisation.category.id can only be a 3 digit number",
    });
  });

  it("should return a validation error when the new condition is a duplicate", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.category.id";
    testRequestBody.body.value = "001";
    const testReq = getRequestMock(testRequestBody);

    await postCreatePolicyCondition(testReq, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      value: "Duplicate existing policy found",
    });
  });

  it("should return a validation error when the new condition contradicts an existing one", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    // 'Contradicting' in this case means you can't have is AND is_not for the same condition and value.
    testRequestBody.body.condition = "organisation.category.id";
    testRequestBody.body.operator = "is_not";
    testRequestBody.body.value = "001";
    const testReq = getRequestMock(testRequestBody);

    await postCreatePolicyCondition(testReq, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      value: "Contradicting policy found",
    });
  });

  it("should return a validation error when the organisation id provided does not exist", async () => {
    getOrganisationRaw.mockReset();
    getOrganisationRaw.mockReturnValue(undefined);
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.id";
    testRequestBody.body.value = "ad73ad54-1bb7-4f8a-a446-45703ee1aacc";
    const testReq = getRequestMock(testRequestBody);

    await postCreatePolicyCondition(testReq, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      value: "Organisation id does not exist",
    });
  });

  it("should render an error when the session.save fails", async () => {
    req.session = {
      save: jest.fn((cb) => cb("Something went wrong")),
    };

    await postCreatePolicyCondition(req, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      condition: "Something went wrong submitting data, please try again",
    });
  });
});
