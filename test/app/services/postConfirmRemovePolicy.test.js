jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);

jest.mock("login.dfe.api-client/services");

const { deleteServicePolicy } = require("login.dfe.api-client/services");
const { getRequestMock, getResponseMock } = require("../../utils");
const postConfirmRemovePolicy = require("../../../src/app/services/postConfirmRemovePolicy");
const logger = require("../../../src/infrastructure/logger");
const res = getResponseMock();

describe("when using the postConfirmRemovePolicy function", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service-id",
        pid: "policy-id",
      },
      body: {
        name: "Test policy",
      },
    });

    res.mockResetAll();

    deleteServicePolicy.mockReset();
    deleteServicePolicy.mockReturnValue(undefined);

    logger.error.mockReset();
    logger.info.mockReset();
    logger.audit.mockReset();
  });

  it("should log an audit entry, flash and redirect after successfully deleting policy", async () => {
    await postConfirmRemovePolicy(req, res);

    expect(logger.audit).toHaveBeenCalledWith(
      "user@unit.test (id: user1) removed a policy for service service-id",
      {
        policyName: "Test policy",
        serviceId: "service-id",
        subType: "policy-removed",
        type: "manage",
        userEmail: "user@unit.test",
        userId: "user1",
      },
    );
    expect(res.flash).toHaveBeenCalledWith(
      "info",
      "Policy 'Test policy' successfully removed",
    );

    expect(res.redirect).toHaveBeenCalledWith("/services/service-id/policies");
  });

  it("should flash and log an error if something goes wrong when deleting the policy", async () => {
    const mockError = new Error("Deletion error");
    deleteServicePolicy.mockRejectedValue(mockError);
    await postConfirmRemovePolicy(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      "Something went wrong when deleting service policy",
      mockError,
    );

    expect(res.flash).toHaveBeenCalledWith(
      "error",
      "Something went wrong when deleting the service policy",
    );

    expect(res.redirect).toHaveBeenCalledWith("/services/service-id/policies");
  });
});
