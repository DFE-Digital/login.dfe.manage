jest.mock("./../../../../src/infrastructure/config", () =>
  require("../../../utils").configMockFactory(),
);
jest.mock("./../../../../src/infrastructure/logger", () =>
  require("../../../utils").loggerMockFactory(),
);

jest.mock("login.dfe.api-client/services");

const { getRequestMock, getResponseMock } = require("../../../utils");
const postCreateNewPolicyName = require("../../../../src/app/services/createNewPolicy/postCreateNewPolicyName");
const { getServiceRaw } = require("login.dfe.api-client/services");
const res = getResponseMock();

// Fields removed for brevity.
const service = {
  id: "service1",
  name: "Service One",
};

describe("when using postCreateNewPolicyName", () => {
  let req;

  beforeEach(() => {
    const requestBody = {
      params: {
        sid: "service-id",
      },
      body: {
        name: "Test policy",
      },
      session: {
        save: jest.fn((cb) => cb()),
      },
    };

    req = getRequestMock(requestBody);

    getServiceRaw.mockReset();
    getServiceRaw.mockResolvedValue(service);

    res.mockResetAll();
  });

  it("should redirect to the confirm page on success", async () => {
    await postCreateNewPolicyName(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("create-new-policy-role");
  });

  it("should trim whitespace from name before validation", async () => {
    req.body.name = "  Test policy  ";

    await postCreateNewPolicyName(req, res);

    expect(req.session.createNewPolicy).toMatchObject({
      name: "Test policy",
      validationMessages: {},
    });
    expect(res.redirect.mock.calls[0][0]).toBe("create-new-policy-role");
  });

  it("should return validation error when name is only whitespace", async () => {
    req.body.name = "   ";

    await postCreateNewPolicyName(req, res);

    expect(res.render.mock.calls[0][1].model.validationMessages).toMatchObject({
      name: "Enter a name",
    });
  });

  it("should trim whitespace before checking name length", async () => {
    req.body.name = "  " + "a".repeat(125) + "  ";

    await postCreateNewPolicyName(req, res);

    expect(req.session.createNewPolicy.name).toBe("a".repeat(125));
    expect(res.redirect.mock.calls[0][0]).toBe("create-new-policy-role");
  });

  it("should return a validation error when the role name is missing", async () => {
    req.body.name = "";

    await postCreateNewPolicyName(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/service-id/policies`,
      cancelLink: `/services/service-id/policies`,
      serviceId: "service-id",
      csrfToken: "token",
      currentNavigation: "policies",
      model: {
        validationMessages: { name: "Enter a name" },
      },
    });
  });

  it("should return a validation error when the role name exceeds 125 characters", async () => {
    req.body.name = "a".repeat(126);

    await postCreateNewPolicyName(req, res);

    expect(res.render.mock.calls[0][1].model.validationMessages).toMatchObject({
      name: "Name must be 125 characters or less",
    });
  });

  it("should render an error when the session.save fails", async () => {
    req.session = {
      save: jest.fn((cb) => cb("Something went wrong")),
    };

    await postCreateNewPolicyName(req, res);

    expect(res.render.mock.calls[0][1].model.validationMessages).toMatchObject({
      name: "Something went wrong submitting data, please try again",
    });
  });

  it("should save the policy data to session on successful validation", async () => {
    await postCreateNewPolicyName(req, res);

    expect(req.session.createNewPolicy).toMatchObject({
      name: "Test policy",
      validationMessages: {},
    });
  });
});
