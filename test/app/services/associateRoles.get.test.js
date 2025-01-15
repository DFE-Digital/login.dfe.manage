jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.policy-engine");
jest.mock("./../../../src/infrastructure/organisations");

const { getRequestMock, getResponseMock } = require("./../../utils");
const PolicyEngine = require("login.dfe.policy-engine");

const policyEngine = {
  getPolicyApplicationResultsForUser: jest.fn(),
};

describe("when displaying the associate roles view", () => {
  let req;
  let res;

  let getAssociateRoles;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: "user1",
        sid: "service1",
      },
      session: {
        user: {
          firstName: "John",
          lastName: "Doe",
          service: "service name",
          organisationName: "organisation name",
          organisationId: "org1",
        },
      },
    });
    res = getResponseMock();

    policyEngine.getPolicyApplicationResultsForUser
      .mockReset()
      .mockReturnValue({
        rolesAvailableToUser: [],
      });
    PolicyEngine.mockReset().mockImplementation(() => policyEngine);

    getAssociateRoles =
      require("./../../../src/app/services/associateRoles").get;
  });

  it("then it should return the edit service view", async () => {
    await getAssociateRoles(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/associateRoles");
  });

  it("then it should include csrf token", async () => {
    await getAssociateRoles(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
    });
  });

  it("then it should include the user details", async () => {
    await getAssociateRoles(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      user: "John Doe",
    });
  });

  it("then it should include the service details", async () => {
    await getAssociateRoles(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      service: "service name",
    });
  });

  it("then it should include the org details", async () => {
    await getAssociateRoles(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      organisation: "organisation name",
    });
  });
});
