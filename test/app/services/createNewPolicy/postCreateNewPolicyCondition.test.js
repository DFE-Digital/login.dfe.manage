jest.mock("./../../../../src/infrastructure/config", () =>
  require("../../../utils").configMockFactory(),
);
jest.mock("./../../../../src/infrastructure/logger", () =>
  require("../../../utils").loggerMockFactory(),
);

jest.mock("login.dfe.api-client/services");

const { getRequestMock, getResponseMock } = require("../../../utils");
const postCreateNewPolicyCondition = require("../../../../src/app/services/createNewPolicy/postCreateNewPolicyCondition");
const { getServiceRaw } = require("login.dfe.api-client/services");
const res = getResponseMock();

const session = {
  createNewPolicy: {
    name: "Test Policy",
    role: {
      roleName: "Test role",
      roleCode: "Test code",
    },
  },
  save: jest.fn((cb) => cb()),
};

// Fields removed for brevity.
const service = {
  id: "service1",
  name: "Service One",
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
  session,
};

describe("when using postCreateNewPolicyCondition", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock(requestBody);

    getServiceRaw.mockReset();
    getServiceRaw.mockResolvedValue(service);

    res.mockResetAll();
  });

  it("should redirect to the policies page on success", async () => {
    await postCreateNewPolicyCondition(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("confirm-create-new-policy");
  });

  it("should redirect to the confirm page on success with ukprn", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.ukprn";
    testRequestBody.body.value = "12345678";
    testRequestBody.session = session;
    const testReq = getRequestMock(testRequestBody);

    await postCreateNewPolicyCondition(testReq, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("confirm-create-new-policy");
  });

  it("should redirect to the confirm page on success with type", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.type.id";
    testRequestBody.body.value = "11";
    testRequestBody.session = session;
    const testReq = getRequestMock(testRequestBody);

    await postCreateNewPolicyCondition(testReq, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("confirm-create-new-policy");
  });

  it("should redirect to the confirm page on success with status", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.status.id";
    testRequestBody.body.value = "11";
    testRequestBody.session = session;
    const testReq = getRequestMock(testRequestBody);

    await postCreateNewPolicyCondition(testReq, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("confirm-create-new-policy");
  });

  it("should redirect to the confirm page on success with id that exists", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.id";
    testRequestBody.body.value = "09001145-f018-45fc-be3f-ce7ff21b7db3";
    testRequestBody.session = session;
    const testReq = getRequestMock(testRequestBody);

    await postCreateNewPolicyCondition(testReq, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("confirm-create-new-policy");
  });

  it("should redirect to the confirm page on success with IsOnAPAR with correct value", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.IsOnAPAR";
    testRequestBody.body.value = "YES";
    testRequestBody.session = session;
    const testReq = getRequestMock(testRequestBody);

    await postCreateNewPolicyCondition(testReq, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("confirm-create-new-policy");
  });

  it("should redirect to the confirm page on success with phaseOfEducation with correct value", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.phaseOfEducation.id";
    testRequestBody.body.value = "1";
    testRequestBody.session = session;
    const testReq = getRequestMock(testRequestBody);

    await postCreateNewPolicyCondition(testReq, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("confirm-create-new-policy");
  });

  it("should redirect to the confirm page on success with localAuthority with correct value", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.localAuthority.id";
    testRequestBody.body.value = "ae7a214e-4e1a-413f-a700-212f00b6255d";
    testRequestBody.session = session;
    const testReq = getRequestMock(testRequestBody);

    await postCreateNewPolicyCondition(testReq, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("confirm-create-new-policy");
  });

  it("should return a validation error when the condition is missing", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "";
    const testReq = getRequestMock(testRequestBody);

    await postCreateNewPolicyCondition(testReq, res);

    // The first test will show everything in the render call.  Subsequent tests
    // will just ensure the validationMessages are correct
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: "/services/service-1/policies/create-new-policy-role",
      cancelLink: "/services/service-1/policies",
      serviceId: "service-1",
      csrfToken: "token",
      currentNavigation: "policies",
      userRoles: [],
      validationMessages: { condition: "Please enter a condition" },
    });
  });

  it("should return a validation error when the operator is missing", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.operator = "";
    const testReq = getRequestMock(testRequestBody);

    await postCreateNewPolicyCondition(testReq, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      operator: "Please enter an operator",
    });
  });

  it("should return a validation error when the value is missing", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.value = "";
    const testReq = getRequestMock(testRequestBody);

    await postCreateNewPolicyCondition(testReq, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      value: "Please enter a value",
    });
  });

  it("should return a validation error when the urn is incorrect", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.urn";
    testRequestBody.body.value = "12345678";
    const testReq = getRequestMock(testRequestBody);

    await postCreateNewPolicyCondition(testReq, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      value: "organisation.urn can only be a 6 digit number",
    });
  });

  it("should return a validation error when the urn is incorrect", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.ukprn";
    testRequestBody.body.value = "1234567890";
    const testReq = getRequestMock(testRequestBody);

    await postCreateNewPolicyCondition(testReq, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      value: "organisation.ukprn can only be an 8 digit number",
    });
  });

  it("should return a validation error when the id is incorrect", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.id";
    testRequestBody.body.value = "not-a-uuid";
    const testReq = getRequestMock(testRequestBody);

    await postCreateNewPolicyCondition(testReq, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      value: "organisation.id needs to be a valid uuid",
    });
  });

  it("should return a validation error when the type is incorrect", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.type.id";
    testRequestBody.body.value = "1234";
    const testReq = getRequestMock(testRequestBody);

    await postCreateNewPolicyCondition(testReq, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      value: "organisation.type.id can only be a 2 digit number",
    });
  });

  it("should return a validation error when the status is incorrect", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.status.id";
    testRequestBody.body.value = "1234";
    const testReq = getRequestMock(testRequestBody);

    await postCreateNewPolicyCondition(testReq, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      value: "organisation.status.id can only be a 1 or 2 digit number",
    });
  });

  it("should return a validation error when the category is incorrect", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.category.id";
    testRequestBody.body.value = "1234";
    const testReq = getRequestMock(testRequestBody);

    await postCreateNewPolicyCondition(testReq, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      value: "organisation.category.id can only be a 3 digit number",
    });
  });

  it("should return a validation error when the IsOnAPAR is incorrect", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.IsOnAPAR";
    testRequestBody.body.value = "Yup";
    const testReq = getRequestMock(testRequestBody);

    await postCreateNewPolicyCondition(testReq, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      value: "organisation.IsOnAPAR can only be YES or NO",
    });
  });

  it("should return a validation error when the phaseOfEducation is incorrect", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.phaseOfEducation.id";
    testRequestBody.body.value = "10";
    const testReq = getRequestMock(testRequestBody);

    await postCreateNewPolicyCondition(testReq, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      value:
        "organisation.phaseOfEducation.id can only be a number between 0 and 7 inclusive",
    });
  });

  it("should return a validation error when the localAuthority is incorrect", async () => {
    const testRequestBody = JSON.parse(JSON.stringify(requestBody));
    testRequestBody.body.condition = "organisation.localAuthority.id";
    testRequestBody.body.value = "not-a-uuid";
    const testReq = getRequestMock(testRequestBody);

    await postCreateNewPolicyCondition(testReq, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      value: "organisation.localAuthority.id needs to be a valid uuid",
    });
  });

  it("should render an error when the session.save fails", async () => {
    req.session = {
      createNewPolicy: {
        name: "Test Policy",
        role: {
          roleName: "Test role",
          roleCode: "Test code",
        },
      },
      save: jest.fn((cb) => cb("Something went wrong")),
    };

    await postCreateNewPolicyCondition(req, res);

    expect(res.render.mock.calls[0][1].validationMessages).toMatchObject({
      condition: "Something went wrong submitting data, please try again",
    });
  });

  it("should save the condition data to session on successful validation", async () => {
    await postCreateNewPolicyCondition(req, res);

    expect(req.session.createNewPolicy).toMatchObject({
      name: "Test Policy",
      role: {
        roleName: "Test role",
        roleCode: "Test code",
      },
      condition: {
        condition: "organisation.urn",
        operator: "is",
        value: "123456",
        validationMessages: {},
      },
    });
  });
});
