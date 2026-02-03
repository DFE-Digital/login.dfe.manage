jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);

jest.mock("login.dfe.api-client/services");

const { getRequestMock, getResponseMock } = require("../../utils");
const getConfirmRemovePolicy = require("../../../src/app/services/getConfirmRemovePolicy");
const { getServicePolicyRaw } = require("login.dfe.api-client/services");
const logger = require("../../../src/infrastructure/logger");
const res = getResponseMock();

const policy = {
  id: "6C8172B6-011B-4526-B04D-E2809A3D71A2",
  name: "Test Service - Test Policy",
  applicationId: "32A923EE-B729-44B1-BB52-1789FD08862A",
  status: { id: 1 },
  conditions: [
    { field: "organisation.status.id", operator: "is", value: ["1", "3", "4"] },
    { field: "organisation.type.id", operator: "is", value: ["57"] },
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

describe("when calling the getConfirmRemovePolicy function", () => {
  let req;

  beforeEach(() => {
    const requestBody = {
      params: {
        sid: "service-id",
        pid: "policy-id",
      },
    };

    req = getRequestMock(requestBody);

    getServicePolicyRaw.mockReset();
    getServicePolicyRaw.mockResolvedValue(policy);

    res.mockResetAll();

    logger.error.mockReset();
    logger.info.mockReset();
  });

  it("should return the confirmRemovePolicy view", async () => {
    await getConfirmRemovePolicy(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe(
      "services/views/confirmRemovePolicy",
    );
  });

  it("should include the following in the model on success", async () => {
    await getConfirmRemovePolicy(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
      policy: policy,
      cancelLink: "/services/service-id/policies/policy-id/conditionsAndRoles",
      backLink: "/services/service-id/policies/policy-id/conditionsAndRoles",
      serviceId: "service-id",
      currentNavigation: "policies",
    });
  });

  it("should call getServicePolicyRaw with the correct parameters", async () => {
    await getConfirmRemovePolicy(req, res);

    expect(getServicePolicyRaw).toHaveBeenCalledWith({
      serviceId: "service-id",
      policyId: "policy-id",
    });
  });

  it("should handle errors when getServicePolicyRaw fails", async () => {
    const mockError = new Error("Policy Fetch Error");
    getServicePolicyRaw.mockRejectedValue(mockError);

    await getConfirmRemovePolicy(req, res);

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
});
