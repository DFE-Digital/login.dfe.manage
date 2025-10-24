jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.api-client/services");

const { getRequestMock, getResponseMock } = require("../../utils");
const postConfirmCreatePolicyRole = require("../../../src/app/services/postConfirmCreatePolicyRole");
const {
  getServicePolicyRaw,
  updateServicePolicyRaw,
  createServiceRole,
  getServiceRolesRaw,
} = require("login.dfe.api-client/services");
const res = getResponseMock();

const existingServiceRoles = [
  {
    id: "717E2ECB-8B76-402C-A142-15DD486CBE95",
    name: "School",
    code: "CheckRecord_School",
    numericId: "22997",
    status: ["1"],
  },
  {
    id: "A1B2C3D4-5E6F-7G8H-9I0J-K1L2M3N4O5P6",
    name: "Existing Role",
    code: "existing_role",
    numericId: "12345",
    status: ["1"],
  },
];

describe("when using the postConfirmCreatePolicyRole function", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service-1",
        pid: "policy-1",
      },
      session: {
        createPolicyRoleData: {
          appId: "service-1",
          roleName: "New Test Role",
          roleCode: "new_test_role",
        },
      },
    });

    const policy = {
      id: "6C8172B6-011B-4526-B04D-E2809A3D71A2",
      name: "Test Service - Test Policy",
      applicationId: "32A923EE-B729-44B1-BB52-1789FD08862A",
      status: { id: 1 },
      conditions: [
        {
          field: "organisation.status.id",
          operator: "is",
          value: ["1", "3", "4"],
        },
        { field: "organisation.type.id", operator: "is", value: ["57"] },
        { field: "organisation.category.id", operator: "is", value: ["001"] },
      ],
      roles: [
        {
          id: "717E2ECB-8B76-402C-A142-15DD486CBE95",
          name: "School",
          code: "CheckRecord_School",
          numericId: "22997",
          status: ["1"],
        },
      ],
    };

    getServicePolicyRaw.mockReset();
    getServicePolicyRaw.mockResolvedValue(policy);

    getServiceRolesRaw.mockReset();
    getServiceRolesRaw.mockResolvedValue(existingServiceRoles);

    updateServicePolicyRaw.mockReset();
    updateServicePolicyRaw.mockResolvedValue(undefined);

    createServiceRole.mockReset();
    createServiceRole.mockResolvedValue({
      id: "NEW-ROLE-ID",
      name: "New Test Role",
      code: "new_test_role",
      numericId: "99999",
      status: ["1"],
    });

    res.mockResetAll();
  });

  it("should create a new role and add it to the policy when the role does not exist in the service", async () => {
    await postConfirmCreatePolicyRole(req, res);

    expect(createServiceRole).toHaveBeenCalledWith({
      appId: "service-1",
      roleName: "New Test Role",
      roleCode: "new_test_role",
    });

    expect(updateServicePolicyRaw).toHaveBeenCalledWith({
      policy: {
        applicationId: "32A923EE-B729-44B1-BB52-1789FD08862A",
        conditions: [
          {
            field: "organisation.status.id",
            operator: "is",
            value: ["1", "3", "4"],
          },
          {
            field: "organisation.type.id",
            operator: "is",
            value: ["57"],
          },
          {
            field: "organisation.category.id",
            operator: "is",
            value: ["001"],
          },
        ],
        id: "6C8172B6-011B-4526-B04D-E2809A3D71A2",
        name: "Test Service - Test Policy",
        roles: [
          {
            code: "CheckRecord_School",
            id: "717E2ECB-8B76-402C-A142-15DD486CBE95",
            name: "School",
            numericId: "22997",
            status: ["1"],
          },
          {
            id: "NEW-ROLE-ID",
            name: "New Test Role",
            code: "new_test_role",
            numericId: "99999",
            status: ["1"],
          },
        ],
        status: {
          id: 1,
        },
      },
      policyId: "policy-1",
      serviceId: "service-1",
    });

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe("conditionsAndRoles");
  });

  it("should add an existing role to the policy when the role already exists in the service", async () => {
    req.session.createPolicyRoleData.roleName = "Existing Role";
    req.session.createPolicyRoleData.roleCode = "existing_role";

    await postConfirmCreatePolicyRole(req, res);

    expect(createServiceRole).not.toHaveBeenCalled();

    expect(updateServicePolicyRaw).toHaveBeenCalledWith({
      policy: {
        applicationId: "32A923EE-B729-44B1-BB52-1789FD08862A",
        conditions: [
          {
            field: "organisation.status.id",
            operator: "is",
            value: ["1", "3", "4"],
          },
          {
            field: "organisation.type.id",
            operator: "is",
            value: ["57"],
          },
          {
            field: "organisation.category.id",
            operator: "is",
            value: ["001"],
          },
        ],
        id: "6C8172B6-011B-4526-B04D-E2809A3D71A2",
        name: "Test Service - Test Policy",
        roles: [
          {
            code: "CheckRecord_School",
            id: "717E2ECB-8B76-402C-A142-15DD486CBE95",
            name: "School",
            numericId: "22997",
            status: ["1"],
          },
          {
            id: "A1B2C3D4-5E6F-7G8H-9I0J-K1L2M3N4O5P6",
            name: "Existing Role",
            code: "existing_role",
            numericId: "12345",
            status: ["1"],
          },
        ],
        status: {
          id: 1,
        },
      },
      policyId: "policy-1",
      serviceId: "service-1",
    });

    expect(res.redirect.mock.calls[0][0]).toBe("conditionsAndRoles");
  });

  it("should clear the session data after successfully adding the role", async () => {
    await postConfirmCreatePolicyRole(req, res);

    expect(req.session.createPolicyRoleData).toBeUndefined();
  });

  it("should flash a success message after adding the role", async () => {
    await postConfirmCreatePolicyRole(req, res);

    expect(res.flash).toHaveBeenCalledWith(
      "info",
      "Policy role New Test Role new_test_role successfully added",
    );
  });

  it("should handle errors when creating a new role fails", async () => {
    createServiceRole.mockRejectedValue(new Error("API Error"));

    await postConfirmCreatePolicyRole(req, res);

    expect(res.flash).toHaveBeenCalledWith(
      "error",
      "Failed to create policy role New Test Role. Please try again.",
    );
    expect(res.redirect).toHaveBeenCalledWith("confirm-create-policy-role");
    expect(req.session.createPolicyRoleData).toBeDefined();
  });
});
