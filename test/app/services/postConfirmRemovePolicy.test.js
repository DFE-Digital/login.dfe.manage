jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);

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
});
