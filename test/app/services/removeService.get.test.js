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

jest.mock("login.dfe.api-client/api/setup");
jest.mock("login.dfe.api-client/services", () => ({
  getServiceRaw: jest.fn(),
}));
jest.mock("./../../../src/infrastructure/organisations");
jest.mock("./../../../src/app/services/utils");

const { getRequestMock, getResponseMock } = require("../../utils");
const { getUserDetails } = require("../../../src/app/services/utils");
const {
  getOrganisationByIdV2,
} = require("../../../src/infrastructure/organisations");
const { getServiceRaw } = require("login.dfe.api-client/services");
const getRemoveService = require("../../../src/app/services/removeService").get;

const res = getResponseMock();

describe("when displaying the remove service access view", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock();
    req.params = {
      uid: "user1",
      oid: "org1",
      sid: "service1",
    };

    getServiceRaw.mockReset();
    getServiceRaw.mockReturnValue({
      id: "service1",
      dateActivated: "10/10/2018",
      name: "service name",
      status: "active",
    });
    getOrganisationByIdV2.mockReset();
    getOrganisationByIdV2.mockReturnValue({
      id: "org1",
      name: "organisation one",
    });
    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: "user1",
    });
  });

  it("then it should get the selected user service", async () => {
    await getRemoveService(req, res);

    expect(getServiceRaw.mock.calls).toHaveLength(1);
    expect(getServiceRaw).toHaveBeenCalledWith({
      by: { serviceId: "service1" },
    });
  });

  it("then it should get the organisation details", async () => {
    await getRemoveService(req, res);

    expect(getOrganisationByIdV2.mock.calls).toHaveLength(1);
    expect(getOrganisationByIdV2.mock.calls[0][0]).toBe("org1");
    expect(getOrganisationByIdV2.mock.calls[0][1]).toBe("correlationId");
  });

  it("then it should return the confirm remove service view", async () => {
    await getRemoveService(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/removeService");
  });

  it("then it should include csrf token", async () => {
    await getRemoveService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
    });
  });

  it("then it should include the service details", async () => {
    await getRemoveService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      service: {
        id: "service1",
        dateActivated: "10/10/2018",
        name: "service name",
        status: "active",
      },
    });
  });

  it("then it should include the org details", async () => {
    await getRemoveService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      organisation: {
        id: "org1",
        name: "organisation one",
      },
    });
  });

  it("then it should include back and cancel links without a returnOrg query string, if the returnOrg ID isn't set", async () => {
    req.query.returnOrg = undefined;
    await getRemoveService(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations/${req.params.oid}`,
      cancelLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    });
  });

  it("then it should include back and cancel links without a returnOrg query string, if the returnOrg ID is invalid", async () => {
    req.query.returnOrg = "foo";
    await getRemoveService(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations/${req.params.oid}`,
      cancelLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    });
  });

  it("then it should include back and cancel links with a returnOrg query string, if the returnOrg ID is valid", async () => {
    const orgId = "7bf1de6d-4799-46f7-ab50-32359f2566ac";
    req.query.returnOrg = orgId;
    await getRemoveService(req, res);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations/${req.params.oid}?returnOrg=${orgId}`,
      cancelLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations?returnOrg=${orgId}`,
    });
  });
});
