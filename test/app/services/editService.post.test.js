jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);
jest.mock("../../../src/app/services/utils", () =>
  require("../../utils").getPartialMock("src/app/services/utils", [
    "getReturnOrgId",
    "getReturnUrl",
  ]),
);

jest.mock("./../../../src/infrastructure/access");
jest.mock("login.dfe.api-client/organisations");
jest.mock("login.dfe.policy-engine");
jest.mock("login.dfe.api-client/services", () => ({
  getServiceRaw: jest.fn(),
}));

const { getServiceRaw } = require("login.dfe.api-client/services");
const PolicyEngine = require("login.dfe.policy-engine");
const { getRequestMock, getResponseMock } = require("../../utils");
const {
  getSingleUserService,
  getSingleInvitationService,
} = require("../../../src/infrastructure/access");
const { getOrganisationRaw } = require("login.dfe.api-client/organisations");

const policyEngine = {
  validate: jest.fn(),
  getPolicyApplicationResultsForUser: jest.fn(),
};

describe("when selecting the roles for a service", () => {
  let req;
  let res;
  let postEditService;

  beforeEach(() => {
    req = getRequestMock();
    req.params = {
      uid: "user1",
      oid: "org1",
      sid: "service1",
    };
    req.body = {
      role: ["role1"],
    };
    getSingleUserService.mockReset();
    getSingleUserService.mockReturnValue({
      id: "service1",
      dateActivated: "10/10/2018",
      name: "service name",
      status: "active",
    });

    getSingleInvitationService.mockReset();
    getSingleInvitationService.mockReturnValue({
      id: "service1",
      dateActivated: "10/10/2018",
      name: "service name",
      status: "active",
    });

    getServiceRaw.mockReset();
    getServiceRaw.mockReturnValue({
      serviceId: "service1",
      name: "service one",
      description: "service description",
      relyingParty: {
        client_id: "clientid",
        client_secret: "dewier-thrombi-confounder-mikado",
        api_secret: "dewier-thrombi-confounder-mikado",
        service_home: "https://www.servicehome.com",
        postResetUrl: "https://www.postreset.com",
        redirect_uris: ["https://www.redirect.com"],
        post_logout_redirect_uris: ["https://www.logout.com"],
        grant_types: ["implicit", "authorization_code"],
        response_types: ["code"],
      },
    });
    getOrganisationRaw.mockReset();
    getOrganisationRaw.mockReturnValue({
      id: "org-1",
      name: "organisation one",
    });

    res = getResponseMock();

    policyEngine.validate.mockReset().mockReturnValue([]);
    policyEngine.getPolicyApplicationResultsForUser
      .mockReset()
      .mockReturnValue({
        rolesAvailableToUser: ["role1"],
      });
    PolicyEngine.mockReset().mockImplementation(() => policyEngine);

    // Require needed on beforeEach as Policy Engine is instantiated outside of route action.

    postEditService = require("../../../src/app/services/editService").post;
  });

  it("then it should render view with error if selection do not meet requirements of service", async () => {
    policyEngine.validate.mockReturnValue([
      { message: "selections not valid" },
    ]);

    await postEditService(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/editService");
  });

  it("then it should include the returnOrgId as null, if the returnOrg ID isn't set and role selection doesn't meet requirements", async () => {
    req.query.returnOrg = undefined;
    policyEngine.validate.mockReturnValue([
      { message: "selections not valid" },
    ]);
    await postEditService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      returnOrgId: null,
    });
  });

  it("then it should include the returnOrgId as null, if the returnOrg ID is invalid and role selection doesn't meet requirements", async () => {
    req.query.returnOrg = "foo";
    policyEngine.validate.mockReturnValue([
      { message: "selections not valid" },
    ]);
    await postEditService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      returnOrgId: null,
    });
  });

  it("then it should include the returnOrgId as an ID string, if the returnOrg ID is valid and role selection doesn't meet requirements", async () => {
    const orgId = "7bf1de6d-4799-46f7-ab50-32359f2566ac";
    req.query.returnOrg = orgId;
    policyEngine.validate.mockReturnValue([
      { message: "selections not valid" },
    ]);
    await postEditService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      returnOrgId: orgId,
    });
  });

  it("then it should include a back link to the user's organisation list without a query string, if the returnOrg ID isn't set and role selection doesn't meet requirements", async () => {
    req.query.returnOrg = undefined;
    policyEngine.validate.mockReturnValue([
      { message: "selections not valid" },
    ]);
    await postEditService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    });
  });

  it("then it should include a back link to the user's organisation list without a query string, if the returnOrg ID is invalid and role selection doesn't meet requirements", async () => {
    req.query.returnOrg = "foo";
    policyEngine.validate.mockReturnValue([
      { message: "selections not valid" },
    ]);
    await postEditService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    });
  });

  it("then it should include a back link to the user's organisation list with a returnOrg query string, if the returnOrg ID is valid and role selection doesn't meet requirements", async () => {
    const orgId = "7bf1de6d-4799-46f7-ab50-32359f2566ac";
    req.query.returnOrg = orgId;
    policyEngine.validate.mockReturnValue([
      { message: "selections not valid" },
    ]);
    await postEditService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations?returnOrg=${orgId}`,
    });
  });

  it("then it should redirect to confirm details without a returnOrg query string, if role selection is valid and the returnOrg ID is not set", async () => {
    req.query.returnOrg = undefined;
    policyEngine.validate.mockReturnValue([]);
    await postEditService(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `${req.params.oid}/confirm-edit-service`,
    );
  });

  it("then it should redirect to confirm details without a returnOrg query string, if role selection is valid and the returnOrg ID is invalid", async () => {
    req.query.returnOrg = "foo";
    policyEngine.validate.mockReturnValue([]);
    await postEditService(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `${req.params.oid}/confirm-edit-service`,
    );
  });

  it("then it should redirect to confirm details with a returnOrg query string, if role selection is valid and the returnOrg ID is set and valid", async () => {
    const orgId = "7bf1de6d-4799-46f7-ab50-32359f2566ac";
    req.query.returnOrg = orgId;
    policyEngine.validate.mockReturnValue([]);
    await postEditService(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `${req.params.oid}/confirm-edit-service?returnOrg=${orgId}`,
    );
  });
});
