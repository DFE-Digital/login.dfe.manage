jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("../../../src/app/services/utils", () =>
  require("../../utils").getPartialMock("src/app/services/utils", [
    "getReturnOrgId",
    "getReturnUrl",
  ]),
);

jest.mock("login.dfe.api-client/api/setup");
jest.mock("login.dfe.api-client/services", () => ({
  getServiceRaw: jest.fn(),
}));
jest.mock("./../../../src/infrastructure/utils");
jest.mock("./../../../src/infrastructure/organisations");
jest.mock("./../../../src/infrastructure/applications");
jest.mock("./../../../src/infrastructure/serviceMapping");
jest.mock("./../../../src/infrastructure/audit");
jest.mock("ioredis");

const {
  getUserDetails,
  getUserDetailsById,
} = require("../../../src/app/services/utils");
const {
  getPageOfUserAudits,
  getUserChangeHistory,
} = require("../../../src/infrastructure/audit");
const {
  getServiceIdForClientId,
} = require("../../../src/infrastructure/serviceMapping");
const { getServiceRaw } = require("login.dfe.api-client/services");
const getAudit = require("../../../src/app/services/getAudit");

const organisationId = "org-1";

const createSimpleAuditRecord = (type, subType, message) => {
  return {
    type,
    subType,
    userId: "user1",
    userEmail: "some.user@test.tester",
    editedUser: "edited-user1",
    organisationId,
    level: "audit",
    message,
    timestamp: "2025-01-29T17:31:00.000Z",
  };
};

describe("when getting users audit details", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      id: "correlationId",
      csrfToken: () => "token",
      accepts: () => ["text/html"],
      query: {
        page: 3,
      },
      params: {
        uid: "user1",
        sid: "service-1",
      },
    };

    res = {
      render: jest.fn(),
      status: jest.fn(),
      send: jest.fn(),
    };
    res.render.mockReturnValue(res);
    res.status.mockReturnValue(res);

    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: "user1",
    });
    getUserDetailsById.mockReset();
    getUserDetailsById.mockReturnValue({
      id: "user1",
    });

    res.render.mockReset();

    getPageOfUserAudits.mockReset();
    getPageOfUserAudits.mockReturnValue({
      audits: [
        {
          type: "sign-in",
          subType: "digipass",
          success: false,
          userId: "user1",
          userEmail: "some.user@test.tester",
          level: "audit",
          message:
            "Successful login attempt for some.user@test.tester (id: user1)",
          timestamp: "2018-01-30T10:31:00.000Z",
          client: "client-1",
        },
        {
          type: "sign-in",
          subType: "username-password",
          success: true,
          userId: "user1",
          userEmail: "some.user@test.tester",
          level: "audit",
          message:
            "Successful login attempt for some.user@test.tester (id: user1)",
          timestamp: "2018-01-30T10:30:53.987Z",
          client: "client-2",
        },
        {
          type: "some-new-type",
          subType: "some-subtype",
          success: false,
          userId: "user1",
          userEmail: "some.user@test.tester",
          level: "audit",
          message: "Some detailed message",
          timestamp: "2018-01-29T17:31:00.000Z",
        },
        createSimpleAuditRecord(
          "manage",
          "user-service-added",
          "some.user@test.tester added service Test Service for user another.user@example.com",
        ),
      ],
      numberOfPages: 3,
      numberOfRecords: 56,
    });

    getUserChangeHistory.mockReset();
    getUserChangeHistory.mockReturnValue({
      audits: [
        {
          type: "support",
          subType: "user-edit",
          success: false,
          userId: "user1",
          userEmail: "some.user@test.tester",
          level: "audit",
          message: "Some detailed message",
          timestamp: "2018-01-29T17:31:00.000Z",
        },
      ],
    });

    getServiceIdForClientId.mockReset();
    getServiceIdForClientId.mockImplementation((clientId) => {
      if (clientId === "client-1") {
        return "service-1";
      }
      if (clientId === "client-2") {
        return "service-2";
      }
      return null;
    });

    getServiceRaw.mockReset();
    getServiceRaw.mockImplementation((params) => ({
      id: params.by.serviceId,
      name: params.by.serviceId,
      description: params.by.serviceId,
    }));
  });

  it("then it should include csrf token, user details, page and number of pages in model", async () => {
    await getAudit(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/audit");
    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
      user: {
        id: "user1",
      },
      page: 3,
      numberOfPages: 3,
    });
  });

  it("then it should include current page of audits in model", async () => {
    await getAudit(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      audits: [
        {
          timestamp: new Date("2018-01-30T10:31:00.000Z"),
          event: {
            type: "sign-in",
            subType: "digipass",
            description: "Sign-in using a digipass key fob",
          },
          service: {
            id: "service-1",
            name: "service-1",
            description: "service-1",
          },
          organisation: null,
          result: false,
          user: {
            id: "user1",
          },
        },
        {
          timestamp: new Date("2018-01-30T10:30:53.987Z"),
          event: {
            type: "sign-in",
            subType: "username-password",
            description: "Sign-in using email address and password",
          },
          service: {
            id: "service-2",
            name: "service-2",
            description: "service-2",
          },
          organisation: null,
          result: true,
          user: {
            id: "user1",
          },
        },
        {
          timestamp: new Date("2018-01-29T17:31:00.000Z"),
          event: {
            type: "some-new-type",
            subType: "some-subtype",
            description: "some-new-type / some-subtype",
          },
          organisation: null,
          service: null,
          result: false,
          user: {
            id: "user1",
          },
        },
        {
          timestamp: new Date("2025-01-29T17:31:00.000Z"),
          formattedTimestamp: "29 Jan 2025 05:31pm",
          event: {
            type: "manage",
            subType: "user-service-added",
            description:
              "some.user@test.tester added service Test Service for user another.user@example.com",
          },
          service: null,
          organisation: undefined,
          result: true,
          user: {
            id: "user1",
          },
        },
      ],
    });
  });

  it("then it should get page of audits using page 1 if page not specified", async () => {
    req.query.page = undefined;

    await getAudit(req, res);

    expect(getPageOfUserAudits.mock.calls).toHaveLength(1);
    expect(getPageOfUserAudits.mock.calls[0][0]).toBe("user1");
    expect(getPageOfUserAudits.mock.calls[0][1]).toBe(1);
  });

  it("then it should get page of audits using page specified and get user details", async () => {
    await getAudit(req, res);

    expect(getUserDetailsById.mock.calls).toHaveLength(1);
    expect(getUserDetailsById.mock.calls[0][0]).toBe(req.params.uid);
    expect(getPageOfUserAudits.mock.calls).toHaveLength(1);
    expect(getPageOfUserAudits.mock.calls[0][0]).toBe("user1");
    expect(getPageOfUserAudits.mock.calls[0][1]).toBe(3);

    expect(getServiceIdForClientId.mock.calls).toHaveLength(2);
    expect(getServiceIdForClientId.mock.calls[0][0]).toBe("client-1");
    expect(getServiceIdForClientId.mock.calls[1][0]).toBe("client-2");

    expect(getServiceRaw.mock.calls).toHaveLength(3);
    expect(getServiceRaw.mock.calls[0][0]).toMatchObject({
      by: { serviceId: "service-1" },
    });
    expect(getServiceRaw.mock.calls[1][0]).toMatchObject({
      by: { serviceId: "service-1" },
    });
    expect(getServiceRaw.mock.calls[2][0]).toMatchObject({
      by: { serviceId: "service-2" },
    });

    expect(res.render.mock.calls[0][1]).toMatchObject({
      totalNumberOfResults: 56,
    });
  });

  it("then it should return 400 if specified page is not numeric", async () => {
    req.query.page = "not-a-number";

    await getAudit(req, res);

    expect(res.status.mock.calls).toHaveLength(1);
    expect(res.status.mock.calls[0][0]).toBe(400);
    expect(res.send.mock.calls).toHaveLength(1);
  });

  it("then it should include the returnOrgId as null, if the returnOrg ID isn't set", async () => {
    req.query.returnOrg = undefined;
    await getAudit(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      returnOrgId: null,
    });
  });

  it("then it should include the returnOrgId as null, if the returnOrg ID is invalid", async () => {
    req.query.returnOrg = "foo";
    await getAudit(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      returnOrgId: null,
    });
  });

  it("then it should include the returnOrgId as an ID string, if the returnOrg ID is valid", async () => {
    const orgId = "7bf1de6d-4799-46f7-ab50-32359f2566ac";
    req.query.returnOrg = orgId;
    await getAudit(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      returnOrgId: orgId,
    });
  });

  it("then it should include a back link to the user's organisation list without a query string, if the returnOrg ID isn't set", async () => {
    req.query.returnOrg = undefined;
    await getAudit(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    });
  });

  it("then it should include a back link to the user's organisation list without a query string, if the returnOrg ID is invalid", async () => {
    req.query.returnOrg = "foo";
    await getAudit(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    });
  });

  it("then it should include a back link to the user's organisation list with a returnOrg query string, if the returnOrg ID is valid", async () => {
    const orgId = "7bf1de6d-4799-46f7-ab50-32359f2566ac";
    req.query.returnOrg = orgId;
    await getAudit(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations?returnOrg=${orgId}`,
    });
  });
});
