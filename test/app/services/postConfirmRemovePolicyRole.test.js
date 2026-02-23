jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);

jest.mock("login.dfe.api-client/services");

const { getRequestMock, getResponseMock } = require("../../utils");
const postConfirmRemovePolicyRole = require("../../../src/app/services/postConfirmRemovePolicyRole");
const {
  getServicePolicyRaw,
  getServicePoliciesRaw,
  updateServicePolicyRaw,
  deleteServiceRoleRaw,
} = require("login.dfe.api-client/services");
const logger = require("../../../src/infrastructure/logger");
const res = getResponseMock();

describe("when using the postConfirmRemovePolicyRole function", () => {
  let req;

  beforeEach(() => {
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
        {
          field: "organisation.category.id",
          operator: "is",
          value: ["001"],
        },
      ],
      roles: [
        {
          id: "717E2ECB-8B76-402C-A142-15DD486CBE95",
          name: "School",
          code: "CheckRecord_School",
          numericId: "22997",
          status: ["1"],
        },
        {
          id: "A1B2C3D4-5E6F-7G8H-9I0J-K1L2M3N4O5P6",
          name: "Teacher",
          code: "CheckRecord_Teacher",
          numericId: "22998",
          status: ["1"],
        },
      ],
    };

    const allServicePolicies = [
      {
        id: "6C8172B6-011B-4526-B04D-E2809A3D71A2",
        name: "Policy 1",
        roles: [
          {
            id: "717E2ECB-8B76-402C-A142-15DD486CBE95",
            name: "School",
            code: "CheckRecord_School",
          },
        ],
      },
      {
        id: "ANOTHER-POLICY-ID",
        name: "Policy 2",
        roles: [
          {
            id: "717E2ECB-8B76-402C-A142-15DD486CBE95",
            name: "School",
            code: "CheckRecord_School",
          },
        ],
      },
    ];

    req = getRequestMock({
      params: {
        sid: "service-id",
        pid: "policy-id",
      },
      body: {
        name: "School",
        code: "CheckRecord_School",
      },
    });

    getServicePolicyRaw.mockReset();
    getServicePolicyRaw.mockResolvedValue(policy);

    getServicePoliciesRaw.mockReset();
    getServicePoliciesRaw.mockResolvedValue(allServicePolicies);

    updateServicePolicyRaw.mockReset();
    updateServicePolicyRaw.mockResolvedValue(undefined);

    deleteServiceRoleRaw.mockReset();
    deleteServiceRoleRaw.mockResolvedValue(undefined);

    res.mockResetAll();

    logger.error.mockReset();
    logger.info.mockReset();
    logger.audit.mockReset();
  });

  it("should remove a role from the policy and not delete it when it exists in other policies", async () => {
    await postConfirmRemovePolicyRole(req, res);

    expect(updateServicePolicyRaw).toHaveBeenCalledWith({
      serviceId: "service-id",
      policyId: "policy-id",
      policy: expect.objectContaining({
        roles: [
          {
            id: "A1B2C3D4-5E6F-7G8H-9I0J-K1L2M3N4O5P6",
            name: "Teacher",
            code: "CheckRecord_Teacher",
            numericId: "22998",
            status: ["1"],
          },
        ],
      }),
    });

    expect(deleteServiceRoleRaw).not.toHaveBeenCalled();

    expect(res.flash).toHaveBeenCalledWith(
      "info",
      "Policy role School CheckRecord_School successfully removed",
    );

    expect(res.redirect).toHaveBeenCalledWith("conditionsAndRoles");
  });

  it("should remove a role from the policy and delete it when it does not exist in other policies", async () => {
    const policiesWithSingleRole = [
      {
        id: "6C8172B6-011B-4526-B04D-E2809A3D71A2",
        name: "Policy 1",
        roles: [
          {
            id: "717E2ECB-8B76-402C-A142-15DD486CBE95",
            name: "School",
            code: "CheckRecord_School",
          },
        ],
      },
    ];

    getServicePoliciesRaw.mockResolvedValue(policiesWithSingleRole);

    await postConfirmRemovePolicyRole(req, res);

    expect(updateServicePolicyRaw).toHaveBeenCalledWith({
      serviceId: "service-id",
      policyId: "policy-id",
      policy: expect.objectContaining({
        roles: [
          {
            id: "A1B2C3D4-5E6F-7G8H-9I0J-K1L2M3N4O5P6",
            name: "Teacher",
            code: "CheckRecord_Teacher",
            numericId: "22998",
            status: ["1"],
          },
        ],
      }),
    });

    expect(deleteServiceRoleRaw).toHaveBeenCalledWith({
      roleId: "717E2ECB-8B76-402C-A142-15DD486CBE95",
      serviceId: "32A923EE-B729-44B1-BB52-1789FD08862A",
    });

    expect(logger.info).toHaveBeenCalledWith(
      "[32A923EE-B729-44B1-BB52-1789FD08862A] [717E2ECB-8B76-402C-A142-15DD486CBE95] does not exist in any other policies for this service. Calling deleteServiceRoleRaw.",
      { correlationId: "correlationId" },
    );

    expect(res.flash).toHaveBeenCalledWith(
      "info",
      "Policy role School CheckRecord_School successfully removed",
    );

    expect(res.redirect).toHaveBeenCalledWith("conditionsAndRoles");
  });

  it("should flash an info message when the role does not exist in the policy", async () => {
    req.body.name = "NonExistent";
    req.body.code = "non_existent_code";

    await postConfirmRemovePolicyRole(req, res);

    expect(logger.info).toHaveBeenCalledWith(
      "[NonExistent] [non_existent_code] not found in existing policy",
      { correlationId: "correlationId" },
    );

    expect(res.flash).toHaveBeenCalledWith(
      "info",
      "Policy role [NonExistent] [non_existent_code] not found in policy. Policy has not been modified",
    );

    expect(res.redirect).toHaveBeenCalledWith("conditionsAndRoles");

    expect(updateServicePolicyRaw).not.toHaveBeenCalled();
    expect(deleteServiceRoleRaw).not.toHaveBeenCalled();
  });

  it("should log an audit entry after successfully removing a role", async () => {
    await postConfirmRemovePolicyRole(req, res);

    expect(logger.audit).toHaveBeenCalledWith(
      "user@unit.test removed a policy role with name 'School'",
      {
        type: "manage",
        subType: "policy-role-removed",
        userId: "user1",
        userEmail: "user@unit.test",
        policyId: "policy-id",
        serviceId: "service-id",
        name: "School",
        code: "CheckRecord_School",
      },
    );
  });

  it("should handle errors when getServicePolicyRaw fails", async () => {
    const mockError = new Error("Policy Fetch Error");
    getServicePolicyRaw.mockRejectedValue(mockError);

    await postConfirmRemovePolicyRole(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      "Error retrieving service policy policy-id",
      {
        correlationId: "correlationId",
        error: mockError,
      },
    );

    expect(res.flash).toHaveBeenCalledWith(
      "error",
      "Failed to retrieve policy. Please try again.",
    );

    expect(res.redirect).toHaveBeenCalledWith(
      "/services/service-id/policies/policy-id/conditionsAndRoles",
    );
  });

  it("should handle errors when getServicePoliciesRaw fails", async () => {
    const mockError = new Error("Policies Fetch Error");
    getServicePoliciesRaw.mockRejectedValue(mockError);

    await postConfirmRemovePolicyRole(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      "Error retrieving service policies for service service-id",
      {
        correlationId: "correlationId",
        error: mockError,
      },
    );

    expect(res.flash).toHaveBeenCalledWith(
      "error",
      "Failed to retrieve service policies. Please try again.",
    );

    expect(res.redirect).toHaveBeenCalledWith(
      "/services/service-id/policies/policy-id/conditionsAndRoles",
    );
  });

  it("should handle errors when updateServicePolicyRaw fails", async () => {
    const mockError = new Error("Update Error");
    updateServicePolicyRaw.mockRejectedValue(mockError);

    await postConfirmRemovePolicyRole(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      "Error updating policy policy-id",
      {
        correlationId: "correlationId",
        error: mockError,
      },
    );

    expect(res.flash).toHaveBeenCalledWith(
      "error",
      "Failed to update policy. Please try again.",
    );

    expect(res.redirect).toHaveBeenCalledWith(
      "/services/service-id/policies/policy-id/conditionsAndRoles",
    );
  });

  it("should handle errors when deleteServiceRoleRaw fails", async () => {
    const policiesWithSingleRole = [
      {
        id: "6C8172B6-011B-4526-B04D-E2809A3D71A2",
        name: "Policy 1",
        roles: [
          {
            id: "717E2ECB-8B76-402C-A142-15DD486CBE95",
            name: "School",
            code: "CheckRecord_School",
          },
        ],
      },
    ];

    getServicePoliciesRaw.mockResolvedValue(policiesWithSingleRole);

    const mockError = new Error("Delete Error");
    deleteServiceRoleRaw.mockRejectedValue(mockError);

    await postConfirmRemovePolicyRole(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      "Error deleting role 717E2ECB-8B76-402C-A142-15DD486CBE95",
      {
        correlationId: "correlationId",
        error: mockError,
      },
    );

    expect(res.flash).toHaveBeenCalledWith(
      "error",
      "Failed to delete role. Please try again.",
    );

    expect(res.redirect).toHaveBeenCalledWith(
      "/services/service-id/policies/policy-id/conditionsAndRoles",
    );
  });

  it("should handle missing body parameters", async () => {
    req.body = {};

    await postConfirmRemovePolicyRole(req, res);

    expect(res.flash).toHaveBeenCalledWith(
      "info",
      "Policy role [] [] not found in policy. Policy has not been modified",
    );

    expect(res.redirect).toHaveBeenCalledWith("conditionsAndRoles");
  });
});
