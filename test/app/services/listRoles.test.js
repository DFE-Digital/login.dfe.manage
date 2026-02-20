jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.api-client/services", () => ({
  getServiceRaw: jest.fn(),
  getServicePoliciesRaw: jest.fn(),
}));

const { getRequestMock, getResponseMock } = require("./../../utils");
const getListRoles = require("./../../../src/app/services/listRoles");
const {
  getServiceRaw,
  getServicePoliciesRaw,
} = require("login.dfe.api-client/services");

const res = getResponseMock();

describe("when getting a list of service roles", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service1",
      },
      session: {},
    });

    getServicePoliciesRaw.mockReset();
    getServicePoliciesRaw.mockReturnValue([
      {
        id: "policy1",
        name: "Policy One",
        applicationId: "service1",
        status: { id: 1 },
        conditions: [],
        roles: [
          {
            id: "role1",
            name: "Role One",
            code: "ROLE1",
            numericId: "1001",
            status: { id: 1 },
          },
          {
            id: "role2",
            name: "Role Two",
            code: "ROLE2",
            numericId: "1002",
            status: { id: 1 },
          },
        ],
      },
      {
        id: "policy2",
        name: "Policy Two",
        applicationId: "service1",
        status: { id: 1 },
        conditions: [],
        roles: [
          {
            id: "role1",
            name: "Role One",
            code: "ROLE1",
            numericId: "1001",
            status: { id: 1 },
          },
          {
            id: "role3",
            name: "Role Three",
            code: "ROLE3",
            numericId: "1003",
            status: { id: 1 },
          },
        ],
      },
    ]);

    getServiceRaw.mockReset();
    getServiceRaw.mockReturnValue({
      id: "service1",
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

    res.mockResetAll();
  });

  it("should get the service policies by service id", async () => {
    await getListRoles(req, res);

    expect(getServicePoliciesRaw.mock.calls).toHaveLength(1);
    expect(getServicePoliciesRaw).toHaveBeenCalledWith({
      serviceId: "service1",
    });
  });

  it("should get the service details", async () => {
    await getListRoles(req, res);

    expect(getServiceRaw.mock.calls).toHaveLength(1);
    expect(getServiceRaw).toHaveBeenCalledWith({
      by: { serviceId: "service1" },
    });
  });

  it("should return the service roles view", async () => {
    await getListRoles(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/listRoles");
  });

  it("should include the service details in the model", async () => {
    await getListRoles(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      serviceDetails: {
        id: "service1",
        name: "service one",
        description: "service description",
      },
    });
  });

  it("should include deduplicated roles in the model", async () => {
    await getListRoles(req, res);

    const { roles } = res.render.mock.calls[0][1];
    expect(roles).toHaveLength(3);
  });

  it("should show role1 belongs to two policies", async () => {
    await getListRoles(req, res);

    const { roles } = res.render.mock.calls[0][1];
    const roleOne = roles.find((r) => r.id === "role1");

    expect(roleOne.policies).toEqual(["Policy One", "Policy Two"]);
  });

  it("should show role2 belongs to one policy", async () => {
    await getListRoles(req, res);

    const { roles } = res.render.mock.calls[0][1];
    const roleTwo = roles.find((r) => r.id === "role2");

    expect(roleTwo.policies).toEqual(["Policy One"]);
  });

  it("it should then clear the createNewPolicy session data", async () => {
    req.session.createNewPolicy = "someData";

    await getListRoles(req, res);

    expect(req.session.createNewPolicy).toBeUndefined();
  });

  it("should include a backLink in the model", async () => {
    await getListRoles(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: true,
    });
  });
});
