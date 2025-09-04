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
  updateUserService: jest.fn(),
  updateInvitationService: jest.fn(),
  listRolesOfService: jest.fn(),
}));

jest.mock("login.dfe.api-client/api/setup");
jest.mock("login.dfe.api-client/services", () => ({
  getServiceRaw: jest.fn(),
}));
jest.mock("./../../../src/infrastructure/organisations", () => ({
  getOrganisationByIdV2: jest.fn(),
}));

const logger = require("../../../src/infrastructure/logger");
const { getRequestMock, getResponseMock } = require("../../utils");
const {
  updateInvitationService,
  updateUserService,
} = require("../../../src/infrastructure/access");
const { listRolesOfService } = require("../../../src/infrastructure/access");
const {
  getOrganisationByIdV2,
} = require("../../../src/infrastructure/organisations");
const { getUserDetails } = require("../../../src/app/services/utils");
const { getServiceRaw } = require("login.dfe.api-client/services");
const postConfirmEditService =
  require("../../../src/app/services/confirmEditService").post;

const res = getResponseMock();

describe("when editing a service for a user", () => {
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

    getServiceRaw.mockReset();
    getServiceRaw.mockReturnValue({
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
    });

    getOrganisationByIdV2.mockReset();
    getOrganisationByIdV2.mockReturnValue({
      id: "org1",
      name: "org name",
    });

    updateUserService.mockReset();
    updateInvitationService.mockReset();

    res.mockResetAll();
  });

  it("then it should edit service for invitation if request for invitation", async () => {
    req.params.uid = "inv-invite1";

    await postConfirmEditService(req, res);

    expect(updateInvitationService.mock.calls).toHaveLength(1);
    expect(updateInvitationService.mock.calls[0][0]).toBe("invite1");
    expect(updateInvitationService.mock.calls[0][1]).toBe("service1");
    expect(updateInvitationService.mock.calls[0][2]).toBe("org1");
    expect(updateInvitationService.mock.calls[0][3]).toEqual(["role_id"]);
    expect(updateInvitationService.mock.calls[0][4]).toBe("correlationId");
  });

  it("then it should edit service for user if request for user", async () => {
    await postConfirmEditService(req, res);

    expect(updateUserService.mock.calls).toHaveLength(1);
    expect(updateUserService.mock.calls[0][0]).toBe("user1");
    expect(updateUserService.mock.calls[0][1]).toBe("service1");
    expect(updateUserService.mock.calls[0][2]).toBe("org1");
    expect(updateUserService.mock.calls[0][3]).toEqual(["role_id"]);
    expect(updateUserService.mock.calls[0][4]).toBe("correlationId");
  });

  it("then it should should audit service being edited", async () => {
    await postConfirmEditService(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe(
      "user@unit.test updated service service name for user undefined",
    );
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: "manage",
      subType: "user-service-updated",
      userId: "user1",
      userEmail: "user@unit.test",
      organisationId: "org1",
      editedUser: "user1",
      editedFields: [
        {
          name: "update_service",
          newValue: ["role_id"],
        },
      ],
    });
  });

  it("then a flash message is shown to the user", async () => {
    await postConfirmEditService(req, res);

    expect(res.flash.mock.calls).toHaveLength(3);
    expect(res.flash.mock.calls[0][0]).toBe("title");
    expect(res.flash.mock.calls[0][1]).toBe("Success");
    expect(res.flash.mock.calls[1][0]).toBe("heading");
    expect(res.flash.mock.calls[1][1]).toBe("Service updated: service name");
    expect(res.flash.mock.calls[2][0]).toBe("message");
    expect(res.flash.mock.calls[2][1]).toBe(
      "Approvers at the relevant organisation have been notified of this change.",
    );
  });

  it("then it should redirect to user details without a returnOrg query string, if the returnOrg ID isn't set", async () => {
    req.query.returnOrg = undefined;
    await postConfirmEditService(req, res);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    );
  });

  it("then it should redirect to user details without a returnOrg query string, if the returnOrg ID is invalid", async () => {
    req.query.returnOrg = "foo";
    await postConfirmEditService(req, res);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    );
  });

  it("then it should redirect to user details with a returnOrg query string, if the returnOrg ID is valid", async () => {
    const orgId = "7bf1de6d-4799-46f7-ab50-32359f2566ac";
    req.query.returnOrg = orgId;
    await postConfirmEditService(req, res);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/services/${req.params.sid}/users/${req.params.uid}/organisations?returnOrg=${orgId}`,
    );
  });
});
