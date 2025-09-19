jest.mock("../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);
jest.mock("../../../src/app/services/utils", () =>
  require("../../utils").getPartialMock("src/app/services/utils", [
    "getReturnOrgId",
    "getReturnUrl",
  ]),
);
jest.mock("login.dfe.api-client/organisations");
jest.mock("login.dfe.policy-engine");
jest.mock("login.dfe.api-client/services", () => ({
  getServiceRaw: jest.fn(),
}));

const PolicyEngine = require("login.dfe.policy-engine");
const { getRequestMock, getResponseMock } = require("../../utils");
const { getServiceRaw } = require("login.dfe.api-client/services");

const policyEngine = {
  getPolicyApplicationResultsForUser: jest.fn(),
  validate: jest.fn(),
};
describe("when associating a service with user", () => {
  let req;
  let res;

  let postAssociateService;

  beforeEach(() => {
    req = getRequestMock();
    req.params = {
      uid: "user1",
      oid: "org1",
      sid: "service1",
    };

    getServiceRaw.mockReset();
    getServiceRaw.mockReturnValue({
      id: "service1",
      name: "Service One",
    });

    res = getResponseMock();

    policyEngine.getPolicyApplicationResultsForUser
      .mockReset()
      .mockReturnValue({
        rolesAvailableToUser: ["role1", "role2"],
      });
    PolicyEngine.mockReset().mockImplementation(() => policyEngine);

    // Require needed on beforeEach as Policy Engine is instantiated outside of route action.

    postAssociateService =
      require("../../../src/app/services/associateService").post;
  });

  it("then it should render a view with error if selection is not valid", async () => {
    policyEngine.validate.mockReturnValue([
      { message: "selections not valid" },
    ]);

    await postAssociateService(req, res);

    expect(res.redirect.mock.calls).toHaveLength(0);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/associateService");
    expect(res.render.mock.calls[0][1]).toMatchObject({
      validationMessages: {
        roles: ["selections not valid"],
      },
    });
  });

  it("then it should include a back link to the user's organisation list without a query string, if a returnOrg ID isn't set and there validation errors", async () => {
    policyEngine.validate.mockReturnValue([
      { message: "selections not valid" },
    ]);
    req.query.returnOrg = undefined;
    await postAssociateService(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    });
  });

  it("then it should include a back link to the user's organisation list without a query string, if a returnOrg ID is invalid and there validation errors", async () => {
    policyEngine.validate.mockReturnValue([
      { message: "selections not valid" },
    ]);
    req.query.returnOrg = "foo";
    await postAssociateService(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    });
  });

  it("then it should include a back link to the user's organisation list with a returnOrg query string, if a returnOrg ID is valid and there are validation errors", async () => {
    policyEngine.validate.mockReturnValue([
      { message: "selections not valid" },
    ]);
    const orgId = "7bf1de6d-4799-46f7-ab50-32359f2566ac";
    req.query.returnOrg = orgId;
    await postAssociateService(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations?returnOrg=${orgId}`,
    });
  });

  it("then it should redirect to confirm details without a returnOrg query string, if selection is valid and the returnOrg ID is not set", async () => {
    policyEngine.validate.mockReturnValue([]);
    req.query.returnOrg = undefined;
    await postAssociateService(req, res);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("confirm-associate-service");
  });

  it("then it should redirect to confirm details without a returnOrg query string, if selection is valid and the returnOrg ID is invalid", async () => {
    policyEngine.validate.mockReturnValue([]);
    req.query.returnOrg = "foo";
    await postAssociateService(req, res);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("confirm-associate-service");
  });

  it("then it should redirect to confirm details with a returnOrg query string, if selection is valid and the returnOrg ID is valid", async () => {
    policyEngine.validate.mockReturnValue([]);
    const orgId = "7bf1de6d-4799-46f7-ab50-32359f2566ac";
    req.query.returnOrg = orgId;
    await postAssociateService(req, res);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `confirm-associate-service?returnOrg=${orgId}`,
    );
  });
});
