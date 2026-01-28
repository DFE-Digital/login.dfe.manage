jest.mock("./../../../../src/infrastructure/config", () =>
  require("../../../utils").configMockFactory(),
);
jest.mock("login.dfe.api-client/services");

const { getRequestMock, getResponseMock } = require("../../../utils");
const getCreateNewPolicyName = require("../../../../src/app/services/createNewPolicy/getCreateNewPolicyName");
const { getServiceRaw } = require("login.dfe.api-client/services");
const res = getResponseMock();

// Fields removed for brevity.
const service = {
  id: "service-1",
  name: "Service One",
};

describe("when calling the getCreateNewPolicyName function", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service-1",
      },
    });

    getServiceRaw.mockReset();
    getServiceRaw.mockResolvedValue(service);

    res.mockResetAll();
  });

  it("should return the createNewPolicyName view", async () => {
    await getCreateNewPolicyName(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe(
      "services/views/createNewPolicyName",
    );
  });

  it("should include the following in the model on success", async () => {
    await getCreateNewPolicyName(req, res);

    expect(res.render.mock.calls[0][1]).toStrictEqual({
      name: "",
      validationMessages: {},
      backLink: `/services/${req.params.sid}/policies`,
      cancelLink: `/services/${req.params.sid}/policies`,
      serviceId: "service-1",
      csrfToken: "token",
      currentNavigation: "policies",
      service,
      userRoles: [],
    });
  });

  it("should call getServiceRaw with the correct parameters", async () => {
    await getCreateNewPolicyName(req, res);

    expect(getServiceRaw).toHaveBeenCalledWith({
      by: {
        serviceId: "service-1",
      },
    });
  });
});
