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

jest.mock("./../../../src/infrastructure/access", () => ({
  addUserService: jest.fn(),
  addInvitationService: jest.fn(),
  listRolesOfService: jest.fn(),
}));

jest.mock("login.dfe.jobs-client", () => ({
  NotificationClient: jest.fn(),
}));

jest.mock("./../../../src/infrastructure/applications", () => ({
  getServiceById: jest.fn(),
}));
jest.mock("./../../../src/infrastructure/organisations");

const { NotificationClient } = require("login.dfe.jobs-client");
const {
  getOrganisationByIdV2,
  getUserOrganisations,
  getInvitationOrganisations,
} = require("../../../src/infrastructure/organisations");

const logger = require("../../../src/infrastructure/logger");
const { getRequestMock, getResponseMock } = require("../../utils");
const {
  addInvitationService,
  addUserService,
  listRolesOfService,
} = require("../../../src/infrastructure/access");

const { getUserDetails } = require("../../../src/app/services/utils");
const { getServiceById } = require("../../../src/infrastructure/applications");
const postConfirmAssociateService =
  require("../../../src/app/services/confirmAssociateService").post;

jest.mock("login.dfe.jobs-client");

const res = getResponseMock();

describe("when confirm associating a service to user", () => {
  let req;
  let sendServiceAddedStub;
  let sendServiceRequestApprovedStub;

  const expectedEmailAddress = "test@test.com";
  const expectedFirstName = "John";
  const expectedLastName = "Doe";
  const expectedOrgName = "Great Big School";
  const expectedServiceName = "service name";
  const expectedRoles = ["role_name"];
  const expectedPermission = {
    id: 0,
    name: "End user",
  };

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: "user1",
        oid: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
        sid: "service1",
      },
      session: {
        service: {
          roles: ["role_id"],
        },
      },
    });

    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: "user1",
      firstName: "John",
      lastName: "Doe",
      email: "test@test.com",
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

    getOrganisationByIdV2.mockReset();
    getOrganisationByIdV2.mockReturnValue({
      id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
      name: "Great Big School",
    });

    getUserOrganisations.mockReset();
    getUserOrganisations.mockReturnValue([
      {
        organisation: {
          id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
          name: "Great Big School",
        },
        role: {
          id: 0,
          name: "End user",
        },
      },
      {
        organisation: {
          id: "fe68a9f4-a995-4d74-aa4b-e39e0e88c15d",
          name: "Little Tiny School",
        },
        role: {
          id: 10000,
          name: "Approver",
        },
      },
    ]);

    getInvitationOrganisations.mockReset();
    getInvitationOrganisations.mockReturnValue([
      {
        invitationId: "E89DF8C6-BED4-480D-9F02-34D177E86DAD",
        organisation: {
          id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
          name: "Great Big School",
        },
        role: {
          id: 0,
          name: "End user",
        },
      },
      {
        invitationId: "E89DF8C6-BED4-480D-9F02-34D177E86DAD",
        organisation: {
          id: "fe68a9f4-a995-4d74-aa4b-e39e0e88c15d",
          name: "Little Tiny School",
        },
        role: {
          id: 10000,
          name: "Approver",
        },
      },
    ]);

    addUserService.mockReset();
    addInvitationService.mockReset();

    sendServiceAddedStub = jest.fn();
    sendServiceRequestApprovedStub = jest.fn();

    NotificationClient.mockReset().mockImplementation(() => ({
      sendServiceRequestApproved: sendServiceRequestApprovedStub,
      sendServiceAdded: sendServiceAddedStub,
    }));

    res.mockResetAll();
  });

  it("then it should associate service with invitation if request for invitation", async () => {
    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: "inv-invite1",
    });
    await postConfirmAssociateService(req, res);

    expect(addInvitationService.mock.calls).toHaveLength(1);
    expect(addInvitationService.mock.calls[0][0]).toBe("invite1");
    expect(addInvitationService.mock.calls[0][1]).toBe("service1");
    expect(addInvitationService.mock.calls[0][2]).toBe(
      "88a1ed39-5a98-43da-b66e-78e564ea72b0",
    );
    expect(addInvitationService.mock.calls[0][3]).toEqual(["role_id"]);
    expect(addInvitationService.mock.calls[0][4]).toBe("correlationId");
  });

  it("then it should associate service with user if request for user", async () => {
    await postConfirmAssociateService(req, res);

    expect(addUserService.mock.calls).toHaveLength(1);
    expect(addUserService.mock.calls[0][0]).toBe("user1");
    expect(addUserService.mock.calls[0][1]).toBe("service1");
    expect(addUserService.mock.calls[0][2]).toBe(
      "88a1ed39-5a98-43da-b66e-78e564ea72b0",
    );
    expect(addUserService.mock.calls[0][3]).toEqual(["role_id"]);
    expect(addUserService.mock.calls[0][4]).toBe("correlationId");
  });

  it("then it should send an email notification to user", async () => {
    await postConfirmAssociateService(req, res);

    expect(listRolesOfService.mock.calls).toHaveLength(1);
    expect(listRolesOfService.mock.calls[0][0]).toBe("service1");
    expect(listRolesOfService.mock.calls[0][1]).toBe("correlationId");

    expect(sendServiceRequestApprovedStub.mock.calls).toHaveLength(1);
    expect(sendServiceRequestApprovedStub.mock.calls[0][0]).toBe(
      expectedEmailAddress,
    );
    expect(sendServiceRequestApprovedStub.mock.calls[0][1]).toBe(
      expectedFirstName,
    );
    expect(sendServiceRequestApprovedStub.mock.calls[0][2]).toBe(
      expectedLastName,
    );
    expect(sendServiceRequestApprovedStub.mock.calls[0][3]).toBe(
      expectedOrgName,
    );
    expect(sendServiceRequestApprovedStub.mock.calls[0][4]).toBe(
      expectedServiceName,
    );
    expect(sendServiceRequestApprovedStub.mock.calls[0][5]).toEqual(
      expectedRoles,
    );
    expect(sendServiceRequestApprovedStub.mock.calls[0][6]).toEqual(
      expectedPermission,
    );
  });

  it("then it should should audit service being added", async () => {
    await postConfirmAssociateService(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe(
      "user@unit.test added service service name for user test@test.com",
    );
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: "manage",
      subType: "user-service-added",
      userId: "user1",
      userEmail: "user@unit.test",
      editedUser: "user1",
      editedFields: [
        {
          name: "add_services",
          newValue: { id: "service1", roles: ["role_id"] },
        },
      ],
    });
  });

  it("then a flash message is shown to the user", async () => {
    await postConfirmAssociateService(req, res);

    expect(res.flash.mock.calls).toHaveLength(3);
    expect(res.flash.mock.calls[0][0]).toBe("title");
    expect(res.flash.mock.calls[0][1]).toBe("Success");
    expect(res.flash.mock.calls[1][0]).toBe("heading");
    expect(res.flash.mock.calls[1][1]).toBe("Service added: service name");
    expect(res.flash.mock.calls[2][0]).toBe("message");
    expect(res.flash.mock.calls[2][1]).toBe(
      "Approvers at the relevant organisation have been notified of this change.",
    );
  });

  it("then it should redirect to user details without a returnOrg query string, if the returnOrg ID isn't set", async () => {
    req.query.returnOrg = undefined;
    await postConfirmAssociateService(req, res);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    );
  });

  it("then it should redirect to user details without a returnOrg query string, if the returnOrg ID is invalid", async () => {
    req.query.returnOrg = "foo";
    await postConfirmAssociateService(req, res);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    );
  });

  it("then it should redirect to user details with a returnOrg query string, if the returnOrg ID is valid", async () => {
    const orgId = "7bf1de6d-4799-46f7-ab50-32359f2566ac";
    req.query.returnOrg = orgId;
    await postConfirmAssociateService(req, res);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/services/${req.params.sid}/users/${req.params.uid}/organisations?returnOrg=${orgId}`,
    );
  });
});
