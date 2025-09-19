jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);
jest.mock("../../../src/app/services/utils", () =>
  require("../../utils").getPartialMock("src/app/services/utils", [
    "getReturnOrgId",
  ]),
);
jest.mock("login.dfe.api-client/services");
jest.mock("login.dfe.api-client/invitations");
jest.mock("./../../../src/infrastructure/organisations");
jest.mock("login.dfe.api-client/users");

const logger = require("../../../src/infrastructure/logger");
const { getRequestMock, getResponseMock } = require("../../utils");
const getUserOrganisations = require("../../../src/app/services/getUserOrganisations");
const {
  getAllUserOrganisations,
  getInvitationOrganisations,
} = require("../../../src/infrastructure/organisations");
const {
  getUsersRaw,
  getUserServicesRaw,
} = require("login.dfe.api-client/users");
const { getUserDetails } = require("../../../src/app/services/utils");

const res = getResponseMock();

describe("when getting users organisation details", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      user: {
        sub: "user1",
        email: "super.user@unit.test",
      },
      params: {
        uid: "user1",
        sid: "service1",
      },
      session: {},
    });

    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: "user1",
    });

    getUserServicesRaw.mockReset();
    getUserServicesRaw.mockReturnValue([
      {
        userId: "user1",
        serviceId: "service1",
        organisationId: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
        roles: [
          {
            name: "Z role",
          },
          {
            name: "A role",
          },
          {
            name: "G role",
          },
        ],
      },
      {
        userId: "user1",
        serviceId: "service2",
        organisationId: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
        roles: [
          {
            name: "Z role",
          },
          {
            name: "A role",
          },
          {
            name: "G role",
          },
        ],
      },
      {
        userId: "user1",
        serviceId: "service3",
        organisationId: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
        roles: [
          {
            name: "Z role",
          },
          {
            name: "A role",
          },
          {
            name: "G role",
          },
        ],
      },
    ]);

    getAllUserOrganisations.mockReset();
    getAllUserOrganisations.mockReturnValue([
      {
        organisation: {
          id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
          name: "Great Big School",
        },
        approvers: ["user1"],
        services: [
          {
            id: "service1",
            name: "Z service",
            serviceRoles: [],
          },
          {
            id: "service2",
            name: "A service",
            serviceRoles: [],
          },
          {
            id: "service3",
            name: "G service",
            serviceRoles: [],
          },
        ],
      },
      {
        organisation: {
          id: "fe68a9f4-a995-4d74-aa4b-e39e0e88c15d",
          name: "Little Tiny School",
        },
        approvers: ["user1"],
        services: [
          {
            id: "service1",
          },
        ],
      },
    ]);

    getInvitationOrganisations.mockReset();
    getInvitationOrganisations.mockReturnValue([
      {
        organisation: {
          id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
          name: "Great Big School",
        },
        approvers: ["user1"],
        services: [
          {
            id: "service1",
          },
        ],
      },
      {
        organisation: {
          id: "fe68a9f4-a995-4d74-aa4b-e39e0e88c15d",
          name: "Little Tiny School",
        },
        approvers: ["user1"],
        services: [
          {
            id: "service1",
          },
        ],
      },
    ]);

    getUsersRaw.mockReset();
    getUsersRaw.mockReturnValue([
      {
        sub: "user1",
        given_name: "User",
        family_name: "One",
        email: "user.one@unit.tests",
      },
      {
        sub: "user6",
        given_name: "User",
        family_name: "Six",
        email: "user.six@unit.tests",
      },
      {
        sub: "user11",
        given_name: "User",
        family_name: "Eleven",
        email: "user.eleven@unit.tests",
      },
    ]);
  });

  it("then it should get user details", async () => {
    await getUserOrganisations(req, res);

    expect(getUserDetails.mock.calls).toHaveLength(1);
    expect(getUserDetails.mock.calls[0][0]).toBe(req);
    expect(res.render.mock.calls[0][1].user).toMatchObject({
      id: "user1",
    });
  });

  it("then it should get organisations mapping for user where they have the service", async () => {
    await getUserOrganisations(req, res);

    expect(getAllUserOrganisations.mock.calls).toHaveLength(1);
    expect(getAllUserOrganisations.mock.calls[0][0]).toBe("user1");
    expect(getAllUserOrganisations.mock.calls[0][1]).toBe("correlationId");

    expect(res.render.mock.calls[0][1].organisations).toHaveLength(2);
    expect(res.render.mock.calls[0][1].organisations[0]).toMatchObject({
      id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
      name: "Great Big School",
    });
    expect(res.render.mock.calls[0][1].organisations[1]).toMatchObject({
      id: "fe68a9f4-a995-4d74-aa4b-e39e0e88c15d",
      name: "Little Tiny School",
    });
  });

  it("then it should get organisations mapping for invitation where they have the service", async () => {
    getUserDetails.mockReturnValue({
      id: "inv-invitation1",
    });

    await getUserOrganisations(req, res);

    expect(getInvitationOrganisations.mock.calls).toHaveLength(1);
    expect(getInvitationOrganisations.mock.calls[0][0]).toBe("invitation1");
    expect(getInvitationOrganisations.mock.calls[0][1]).toBe("correlationId");

    expect(res.render.mock.calls[0][1].organisations).toHaveLength(2);
    expect(res.render.mock.calls[0][1].organisations[0]).toMatchObject({
      id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
      name: "Great Big School",
    });
    expect(res.render.mock.calls[0][1].organisations[1]).toMatchObject({
      id: "fe68a9f4-a995-4d74-aa4b-e39e0e88c15d",
      name: "Little Tiny School",
    });
  });

  it("then it should should audit user being viewed", async () => {
    await getUserOrganisations(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe(
      "super.user@unit.test viewed user undefined",
    );
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: "organisations",
      subType: "user-view",
      userEmail: "super.user@unit.test",
      userId: "user1",
      viewedUser: "user1",
    });
  });

  it("then it should include the returnOrgId as null, if the returnOrg ID isn't set", async () => {
    req.query.returnOrg = undefined;
    await getUserOrganisations(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      returnOrgId: null,
    });
  });

  it("then it should include the returnOrgId as null, if the returnOrg ID is invalid", async () => {
    req.query.returnOrg = "foo";
    await getUserOrganisations(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      returnOrgId: null,
    });
  });

  it("then it should include the returnOrgId as an ID string, if the returnOrg ID is valid", async () => {
    const orgId = "7bf1de6d-4799-46f7-ab50-32359f2566ac";
    req.query.returnOrg = orgId;
    await getUserOrganisations(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      returnOrgId: orgId,
    });
  });

  it("then it should include a back link to the user management tab, if the returnOrg ID isn't set", async () => {
    req.query.returnOrg = undefined;
    await getUserOrganisations(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users`,
    });
  });

  it("then it should include a back link to the user management tab, if the returnOrg ID is invalid", async () => {
    req.query.returnOrg = "foo";
    await getUserOrganisations(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users`,
    });
  });

  it("then it should include a back link to the organisation's user list, if a returnOrg ID is valid", async () => {
    const orgId = "7bf1de6d-4799-46f7-ab50-32359f2566ac";
    req.query.returnOrg = orgId;
    await getUserOrganisations(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/organisations/${orgId}/users`,
    });
  });

  it("should return the list of the users services in alphabetical order", async () => {
    await getUserOrganisations(req, res);
    expect(res.render.mock.calls[0][1].organisations[0]).toMatchObject({
      id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
      name: "Great Big School",
      services: [
        {
          id: "service2",
          name: "A service",
          serviceRoles: [
            {
              name: "A role",
            },
            {
              name: "G role",
            },
            {
              name: "Z role",
            },
          ],
        },
        {
          id: "service3",
          name: "G service",
          serviceRoles: [
            {
              name: "A role",
            },
            {
              name: "G role",
            },
            {
              name: "Z role",
            },
          ],
        },
        {
          id: "service1",
          name: "Z service",
          serviceRoles: [
            {
              name: "A role",
            },
            {
              name: "G role",
            },
            {
              name: "Z role",
            },
          ],
        },
      ],
    });
  });
});
