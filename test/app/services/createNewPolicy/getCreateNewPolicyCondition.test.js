jest.mock("./../../../../src/infrastructure/config", () =>
  require("../../../utils").configMockFactory(),
);
jest.mock("login.dfe.api-client/services");

const { getRequestMock, getResponseMock } = require("../../../utils");
const getCreateNewPolicyCondition = require("../../../../src/app/services/createNewPolicy/getCreateNewPolicyCondition");
const { getServiceRaw } = require("login.dfe.api-client/services");
const res = getResponseMock();

// Fields removed for brevity.
const service = {
  id: "service-1",
  name: "Service One",
};

describe("when calling the getCreateNewPolicyCondition function", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service-1",
      },
      session: {
        createNewPolicy: {
          name: "Test Policy",
        },
      },
    });

    getServiceRaw.mockReset();
    getServiceRaw.mockResolvedValue(service);

    res.mockResetAll();
  });

  it("should return the createNewPolicyCondition view", async () => {
    await getCreateNewPolicyCondition(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe(
      "services/views/createNewPolicyCondition",
    );
  });

  it("should include the following in the model on success", async () => {
    await getCreateNewPolicyCondition(req, res);

    expect(res.render.mock.calls[0][1]).toStrictEqual({
      backLink: `/services/${req.params.sid}/policies/create-new-policy-role`,
      cancelLink: `/services/${req.params.sid}/policies`,
      serviceId: "service-1",
      csrfToken: "token",
      currentNavigation: "policies",
      policyName: "Test Policy",
      condition: undefined,
      operator: undefined,
      value: undefined,
      validationMessages: {},
      service,
      userRoles: [],
    });
  });

  it("should call getServiceRaw with the correct parameters", async () => {
    await getCreateNewPolicyCondition(req, res);

    expect(getServiceRaw).toHaveBeenCalledWith({
      by: {
        serviceId: "service-1",
      },
    });
  });

  it("should redirect to policies if there is no data in the session", async () => {
    req = getRequestMock({
      params: {
        sid: "service-1",
      },
    });
    await getCreateNewPolicyCondition(req, res);

    expect(res.redirect.mock.calls[0][0]).toBe("/services/service-1/policies");
  });
});
