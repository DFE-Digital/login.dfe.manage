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
jest.mock("login.dfe.policy-engine");
jest.mock("login.dfe.api-client/services", () => ({
  getServiceRaw: jest.fn(),
}));
jest.mock("login.dfe.api-client/organisations");

const PolicyEngine = require("login.dfe.policy-engine");
const { getRequestMock, getResponseMock } = require("../../utils");
const { getUserDetails } = require("../../../src/app/services/utils");
const { getOrganisationRaw } = require("login.dfe.api-client/organisations");
const { getServiceRaw } = require("login.dfe.api-client/services");

const policyEngine = {
  getPolicyApplicationResultsForUser: jest.fn(),
  validate: jest.fn(),
};
describe("when displaying the associate service view", () => {
  let req;
  let res;

  let getAssociateService;

  beforeEach(() => {
    req = getRequestMock();
    req.params = {
      uid: "user1",
      oid: "org1",
      sid: "service1",
    };

    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: "user1",
      name: "John Doe",
      firstName: "John",
      lastName: "Doe",
      email: "johndoe@test.gov.uk",
    });

    getOrganisationRaw.mockReset();
    getOrganisationRaw.mockReturnValue({
      id: "org1",
      name: "Organisation One",
    });

    getServiceRaw.mockReset();
    getServiceRaw.mockReturnValue({
      id: "service1",
      dateActivated: "10/10/2018",
      name: "Service One",
    });

    res = getResponseMock();

    policyEngine.getPolicyApplicationResultsForUser
      .mockReset()
      .mockReturnValue([
        {
          rolesAvailableToUser: [
            { id: "role1", name: "Role Z" },
            { id: "role2", name: "Role B" },
            { id: "role3", name: "Role A" },
          ],
        },
      ]);
    PolicyEngine.mockReset().mockImplementation(() => policyEngine);

    // Require needed on beforeEach as Policy Engine is instantiated outside of route action.
    getAssociateService =
      require("../../../src/app/services/associateService").get;
  });

  it("then it should get the user details", async () => {
    await getAssociateService(req, res);
    expect(getUserDetails.mock.calls).toHaveLength(1);
  });

  it("then it should get the service details by id", async () => {
    await getAssociateService(req, res);

    expect(getServiceRaw.mock.calls).toHaveLength(1);
    expect(getServiceRaw).toHaveBeenCalledWith({
      by: { serviceId: "service1" },
    });
  });

  it("then it should get the org details", async () => {
    await getAssociateService(req, res);

    expect(getOrganisationRaw.mock.calls).toHaveLength(1);
    expect(getOrganisationRaw).toHaveBeenCalledWith({
      by: { organisationId: "org1" },
    });
  });

  it("then it should return the associate service view", async () => {
    await getAssociateService(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/associateService");
  });

  it("then it should include csrf token", async () => {
    await getAssociateService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
    });
  });

  it("then it should include the user details", async () => {
    await getAssociateService(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      user: { id: "user1", email: "johndoe@test.gov.uk", name: "John Doe" },
    });
  });

  it("then it should include the organisation details", async () => {
    await getAssociateService(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      organisation: { id: "org1", name: "Organisation One" },
    });
  });

  it("then it should include the service details", async () => {
    await getAssociateService(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      service: { id: "service1", name: "Service One" },
    });
  });

  it("then it should include the roles available to the user in alphabetical order", async () => {
    await getAssociateService(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      serviceRoles: [
        { id: "role3", name: "Role A" },
        { id: "role2", name: "Role B" },
        { id: "role1", name: "Role Z" },
      ],
    });
  });

  it("then it should include a back link to the user's organisation list without a query string, if the returnOrg ID isn't set", async () => {
    req.query.returnOrg = undefined;
    await getAssociateService(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    });
  });

  it("then it should include a back link to the user's organisation list without a query string, if the returnOrg ID is invalid", async () => {
    req.query.returnOrg = "foo";
    await getAssociateService(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    });
  });

  it("then it should include a back link to the user's organisation list with a returnOrg query string, if the returnOrg ID is valid", async () => {
    const orgId = "7bf1de6d-4799-46f7-ab50-32359f2566ac";
    req.query.returnOrg = orgId;
    await getAssociateService(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations?returnOrg=${orgId}`,
    });
  });
});
