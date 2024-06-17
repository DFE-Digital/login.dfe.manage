/* eslint-disable global-require */
jest.mock("../../../src/infrastructure/config", () => require("../../utils").configMockFactory());
jest.mock("../../../src/infrastructure/logger", () => require("../../utils").loggerMockFactory());
jest.mock("../../../src/app/services/utils", () => require("../../utils").getPartialMock("src/app/services/utils", ["getReturnOrgId", "getReturnUrl"]));
/* eslint-enable global-require */
jest.mock("../../../src/infrastructure/access", () => ({
  listRolesOfService: jest.fn(),
}));
jest.mock("../../../src/infrastructure/applications", () => ({
  getServiceById: jest.fn(),
}));
jest.mock("../../../src/infrastructure/organisations", () => ({
  getOrganisationByIdV2: jest.fn(),
}));

const { getRequestMock, getResponseMock } = require("../../utils");
const { listRolesOfService } = require("../../../src/infrastructure/access");
const { getOrganisationByIdV2 } = require("../../../src/infrastructure/organisations");
const { getUserDetails } = require("../../../src/app/services/utils");
const { getServiceById } = require("../../../src/infrastructure/applications");
const getConfirmAssociateService = require("../../../src/app/services/confirmAssociateService").get;

const res = getResponseMock();

describe("when displaying the confirm associate service view", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: "user1",
        oid: "org1",
        sid: "service1",
      },
      session: {
        service: {
          roles: ["role_id"],
        },
      },
    });

    getServiceById.mockReset();
    getServiceById.mockReturnValue({
      id: "service1",
      dateActivated: "10/10/2018",
      name: "service name",
      status: "active",
    });

    listRolesOfService.mockReset();
    listRolesOfService.mockReturnValue([
      {
        code: "role_code",
        id: "role_id",
        name: "role_name",
        status: {
          id: "status_id",
        },
      },
    ]);

    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: "user1",
      name: "John Doe",
    });

    getOrganisationByIdV2.mockReset();
    getOrganisationByIdV2.mockReturnValue({
      id: "org1",
      name: "org name",
    });
  });

  it("then it should get the service details by id", async () => {
    await getConfirmAssociateService(req, res);

    expect(getServiceById.mock.calls).toHaveLength(1);
    expect(getServiceById.mock.calls[0][0]).toBe("service1");
    expect(getServiceById.mock.calls[0][1]).toBe("correlationId");
  });

  it("then it should get the selected roles details", async () => {
    await getConfirmAssociateService(req, res);

    expect(listRolesOfService.mock.calls).toHaveLength(1);
    expect(listRolesOfService.mock.calls[0][0]).toBe("service1");
    expect(listRolesOfService.mock.calls[0][1]).toBe("correlationId");
  });

  it("then it should get the org details", async () => {
    await getConfirmAssociateService(req, res);

    expect(getOrganisationByIdV2.mock.calls).toHaveLength(1);
    expect(getOrganisationByIdV2.mock.calls[0][0]).toBe("org1");
    expect(getOrganisationByIdV2.mock.calls[0][1]).toBe("correlationId");
  });

  it("then it should return the confirm associate services view", async () => {
    await getConfirmAssociateService(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/confirmAssociateService");
  });

  it("then it should include csrf token", async () => {
    await getConfirmAssociateService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
    });
  });

  it("then it should include the user details", async () => {
    await getConfirmAssociateService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      user: {
        id: "user1",
        name: "John Doe",
      },
    });
  });

  it("then it should include the organisation details", async () => {
    await getConfirmAssociateService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      organisation: {
        id: "org1",
        name: "org name",
      },
    });
  });

  it("then it should include the service details", async () => {
    await getConfirmAssociateService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      service: {
        id: "service1",
        dateActivated: "10/10/2018",
        name: "service name",
        status: "active",
      },
    });
  });

  it("then it should include the roles", async () => {
    await getConfirmAssociateService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      roles: [
        {
          code: "role_code",
          id: "role_id",
          name: "role_name",
          status: {
            id: "status_id",
          },
        },
      ],
    });
  });

  it("then it should include back and cancel links without a returnOrg query string, if the returnOrg ID isn't set", async () => {
    req.query.returnOrg = undefined;
    await getConfirmAssociateService(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations/${req.params.oid}/associate-service`,
      cancelLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    });
  });

  it("then it should include back and cancel links without a returnOrg query string, if the returnOrg ID is invalid", async () => {
    req.query.returnOrg = "foo";
    await getConfirmAssociateService(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations/${req.params.oid}/associate-service`,
      cancelLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    });
  });

  it("then it should include back and cancel links with a returnOrg query string, if the returnOrg ID is valid", async () => {
    const orgId = "7bf1de6d-4799-46f7-ab50-32359f2566ac";
    req.query.returnOrg = orgId;
    await getConfirmAssociateService(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations/${req.params.oid}/associate-service?returnOrg=${orgId}`,
      cancelLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations?returnOrg=${orgId}`,
    });
  });
});
