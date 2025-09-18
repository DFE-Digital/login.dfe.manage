jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/infrastructure/access");
jest.mock("login.dfe.api-client/services", () => ({
  getServiceRaw: jest.fn(),
  getPaginatedServicePoliciesRaw: jest.fn(),
}));

const { getRequestMock, getResponseMock } = require("./../../utils");
const getListPolicies = require("./../../../src/app/services/listPolicies").get;
const {
  getServiceRaw,
  getPaginatedServicePoliciesRaw,
} = require("login.dfe.api-client/services");

const res = getResponseMock();

describe("when getting the list of service policies", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service1",
      },
      userServices: {
        roles: [
          {
            code: "serviceid_serviceconfiguration",
          },
        ],
      },
      query: {
        page: 1,
        pageSize: 25,
      },
    });

    getPaginatedServicePoliciesRaw.mockReset();
    getPaginatedServicePoliciesRaw.mockReturnValue({
      policies: [
        {
          id: "policyId",
          applicationId: "serviceId",
          name: "policy name",
          status: {
            id: "1",
          },
          conditions: [],
          roles: [],
        },
      ],
      page: 1,
      totalNumberOfPages: 1,
      totalNumberOfRecords: 1,
    });

    getServiceRaw.mockReset();
    getServiceRaw.mockReturnValue({
      id: "service1",
      name: "service one",
      description: "service description",
      relyingParty: {
        client_id: "clientid",
        client_secret: "dewier-thrombi-confounder-mikado",
        api_secret: "dewier-thrombi-confounder-mikado",
        service_home: "https://www.servicehome.com",
        postResetUrl: "https://www.postreset.com",
        redirect_uris: ["https://www.redirect.com"],
        post_logout_redirect_uris: ["https://www.logout.com"],
        grant_types: ["implicit", "authorization_code"],
        response_types: ["code"],
      },
    });
    res.mockResetAll();
  });

  it("then it should get the services policies by service id", async () => {
    await getListPolicies(req, res);

    expect(getPaginatedServicePoliciesRaw.mock.calls).toHaveLength(1);
    expect(getPaginatedServicePoliciesRaw).toHaveBeenCalledWith({
      serviceId: "service1",
      page: 1,
      pageSize: 25,
    });
  });

  it("then it should get the service details", async () => {
    await getListPolicies(req, res);

    expect(getServiceRaw.mock.calls).toHaveLength(1);
    expect(getServiceRaw).toHaveBeenCalledWith({
      by: { serviceId: "service1" },
    });
  });

  it("then it should return the service policies view", async () => {
    await getListPolicies(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe("services/views/listPolicies");
  });

  it("then it should include csrf token in model", async () => {
    await getListPolicies(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
    });
  });

  it("then it should include the service banners list in the model", async () => {
    await getListPolicies(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      policies: [
        {
          id: "policyId",
          applicationId: "serviceId",
          name: "policy name",
          status: {
            id: "1",
          },
        },
      ],
    });
  });

  it("then it should include the pagination details in the model", async () => {
    await getListPolicies(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      page: 1,
      numberOfPages: 1,
      totalNumberOfResults: 1,
    });
  });
});
