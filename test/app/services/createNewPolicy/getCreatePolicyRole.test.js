jest.mock("./../../../../src/infrastructure/config", () =>
  require("../../../utils").configMockFactory(),
);
jest.mock("login.dfe.api-client/services");

const { getRequestMock, getResponseMock } = require("../../../utils");
const getCreateNewPolicyRole = require("../../../../src/app/services/createNewPolicy/getCreateNewPolicyRole");
const { getServiceRaw } = require("login.dfe.api-client/services");
const res = getResponseMock();

// Fields removed for brevity.
const service = {
  id: "service1",
  name: "Service One",
};

describe("when calling the getCreatePolicyRole function", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service-id",
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

  it("should return the createPolicyRole view", async () => {
    await getCreateNewPolicyRole(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe(
      "services/views/createNewPolicyRole",
    );
  });

  it("should include the following in the model on success", async () => {
    await getCreateNewPolicyRole(req, res);

    expect(res.render.mock.calls[0][1]).toStrictEqual({
      backLink: `/services/${req.params.sid}/policies/create-new-policy-name`,
      cancelLink: `/services/${req.params.sid}/policies`,
      serviceId: "service-id",
      csrfToken: "token",
      currentNavigation: "policies",
      model: {
        name: "Test Policy",
      },
      service,
      userRoles: [],
    });
  });

  it("should call getServiceRaw with the correct parameters", async () => {
    await getCreateNewPolicyRole(req, res);

    expect(getServiceRaw).toHaveBeenCalledWith({
      by: {
        serviceId: "service-id",
      },
    });
  });

  it("should redirect to policies if there is no data in the session", async () => {
    req = getRequestMock({
      params: {
        sid: "service-id",
      },
    });
    await getCreateNewPolicyRole(req, res);

    expect(res.redirect.mock.calls[0][0]).toBe("/services/service-id/policies");
  });
});
