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

jest.mock("login.dfe.policy-engine");
jest.mock("./../../../src/infrastructure/access");
jest.mock("./../../../src/infrastructure/organisations");
jest.mock("login.dfe.api-client/services", () => ({
  getServiceRaw: jest.fn(),
}));

const PolicyEngine = require("login.dfe.policy-engine");
const { getRequestMock, getResponseMock } = require("../../utils");
const {
  getSingleUserService,
  getSingleInvitationService,
} = require("../../../src/infrastructure/access");
const { getServiceRaw } = require("login.dfe.api-client/services");
const { getUserDetails } = require("../../../src/app/services/utils");
const {
  getOrganisationByIdV2,
} = require("../../../src/infrastructure/organisations");

const policyEngine = {
  getPolicyApplicationResultsForUser: jest.fn(),
};

describe("when displaying the edit service view", () => {
  let req;
  let res;

  let getEditService;

  beforeEach(() => {
    req = getRequestMock();
    req.params = {
      uid: "user1",
      oid: "org1",
      sid: "service1",
    };
    res = getResponseMock();

    policyEngine.getPolicyApplicationResultsForUser
      .mockReset()
      .mockReturnValue({
        rolesAvailableToUser: [],
      });
    PolicyEngine.mockReset().mockImplementation(() => policyEngine);

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

    getOrganisationByIdV2.mockReset();
    getOrganisationByIdV2.mockReturnValue({
      id: "org-1",
      name: "organisation one",
    });

    // Require needed on beforeEach as Policy Engine is instantiated outside of route action.
    getEditService = require("../../../src/app/services/editService").get;
  });

  it("then it should get the selected user service if req for user", async () => {
    await getEditService(req, res);

    expect(getSingleUserService.mock.calls).toHaveLength(1);
    expect(getSingleUserService.mock.calls[0][0]).toBe("user1");
    expect(getSingleUserService.mock.calls[0][1]).toBe("service1");
    expect(getSingleUserService.mock.calls[0][2]).toBe("org1");
    expect(getSingleUserService.mock.calls[0][3]).toBe("correlationId");
  });

  it("then it should get the selected invitation service if req for inv", async () => {
    req.params.uid = "inv-user1";
    await getEditService(req, res);

    expect(getSingleInvitationService.mock.calls).toHaveLength(1);
    expect(getSingleInvitationService.mock.calls[0][0]).toBe("user1");
    expect(getSingleInvitationService.mock.calls[0][1]).toBe("service1");
    expect(getSingleInvitationService.mock.calls[0][2]).toBe("org1");
    expect(getSingleInvitationService.mock.calls[0][3]).toBe("correlationId");
  });

  it("then it should get user details", async () => {
    await getEditService(req, res);

    expect(getUserDetails.mock.calls).toHaveLength(1);
    expect(getUserDetails.mock.calls[0][0]).toBe(req);
  });

  it("then it should get the org details", async () => {
    await getEditService(req, res);

    expect(getOrganisationByIdV2.mock.calls).toHaveLength(1);
    expect(getOrganisationByIdV2.mock.calls[0][0]).toBe("org1");
    expect(getOrganisationByIdV2.mock.calls[0][1]).toBe("correlationId");
  });

  it("then it should return the edit service view", async () => {
    await getEditService(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/editService");
  });

  it("then it should include csrf token", async () => {
    await getEditService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
    });
  });

  it("then it should include the organisation details", async () => {
    await getEditService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      organisation: {
        id: "org-1",
        name: "organisation one",
      },
    });
  });

  it("then it should include the service details", async () => {
    await getEditService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      service: {
        name: "service one",
      },
    });
  });

  it("then it should include the returnOrgId as null, if the returnOrg ID isn't set", async () => {
    req.query.returnOrg = undefined;
    await getEditService(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      returnOrgId: null,
    });
  });

  it("then it should include the returnOrgId as null, if the returnOrg ID is invalid", async () => {
    req.query.returnOrg = "foo";
    await getEditService(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      returnOrgId: null,
    });
  });

  it("then it should include the returnOrgId as an ID string, if the returnOrg ID is valid", async () => {
    const orgId = "7bf1de6d-4799-46f7-ab50-32359f2566ac";
    req.query.returnOrg = orgId;
    await getEditService(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      returnOrgId: orgId,
    });
  });

  it("then it should include a back link to the user's organisation list without a query string, if the returnOrg ID isn't set", async () => {
    req.query.returnOrg = undefined;
    await getEditService(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    });
  });

  it("then it should include a back link to the user's organisation list without a query string, if the returnOrg ID is invalid", async () => {
    req.query.returnOrg = "foo";
    await getEditService(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    });
  });

  it("then it should include a back link to the user's organisation list with a returnOrg query string, if the returnOrg ID is valid", async () => {
    const orgId = "7bf1de6d-4799-46f7-ab50-32359f2566ac";
    req.query.returnOrg = orgId;
    await getEditService(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations?returnOrg=${orgId}`,
    });
  });
});
