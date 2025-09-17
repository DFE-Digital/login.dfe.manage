jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/infrastructure/access");
jest.mock("login.dfe.api-client/services", () => ({
  getServiceRaw: jest.fn(),
  updateService: jest.fn(),
  getPaginatedServicesRaw: jest.fn(),
}));
jest.mock("../../../src/app/services/utils");

const { getRequestMock, getResponseMock } = require("../../utils");
const postConfirmEditServiceInfo = require("../../../src/app/services/postConfirmEditServiceInfo");
const {
  listRolesOfService,
  updateRole,
} = require("../../../src/infrastructure/access");
const { getUserServiceRoles } = require("../../../src/app/services/utils");
const {
  getServiceRaw,
  updateService,
  getPaginatedServicesRaw,
} = require("login.dfe.api-client/services");
const res = getResponseMock();

const getServiceByIdData = {
  id: "service-1",
  name: "service one",
  description: "service description",
  relyingParty: {
    client_id: "serviceClientId",
  },
  // Other fields would be present, but omitted for brevity
};

const getPaginatedServicesRawData = {
  services: [
    {
      id: "service-1",
      name: "service one",
      description: "service description",
    },
    {
      id: "service-2",
      name: "service two",
      description: "service description two",
    },
  ],
};

const listRolesOfServiceData = [
  {
    code: "service-1_serviceconfig",
    id: "role-id",
    name: "service one - Service configuration",
    status: {
      id: 1,
    },
  },
];

describe("when getting the post confirm edit service info page", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service-1",
      },
      session: {
        editServiceInfo: {
          name: "new service name",
        },
      },
      userServices: {
        roles: [
          {
            code: "serviceid_serviceconfiguration",
          },
        ],
      },
    });

    getServiceRaw.mockReset();
    getServiceRaw.mockReturnValue(getServiceByIdData);

    getPaginatedServicesRaw.mockReset();
    getPaginatedServicesRaw.mockReturnValue(getPaginatedServicesRawData);

    listRolesOfService.mockReset();
    listRolesOfService.mockReturnValue(listRolesOfServiceData);

    getUserServiceRoles.mockReset();
    getUserServiceRoles.mockReturnValue(["serviceid_serviceconfiguration"]);

    res.mockResetAll();
  });

  it("should redirect to the confirm page on success", async () => {
    await postConfirmEditServiceInfo(req, res);

    expect(listRolesOfService.mock.calls).toHaveLength(1);
    expect(updateRole.mock.calls).toHaveLength(1);
    expect(updateService.mock.calls).toHaveLength(1);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      "/services/service-1/service-information",
    );
    expect(res.flash.mock.calls).toHaveLength(3);
    expect(res.flash.mock.calls[0][0]).toBe("title");
    expect(res.flash.mock.calls[0][1]).toBe("Success");
    expect(res.flash.mock.calls[1][0]).toBe("heading");
    expect(res.flash.mock.calls[1][1]).toBe(
      "Service updated: new service name",
    );
    expect(res.flash.mock.calls[2][0]).toBe("message");
    expect(res.flash.mock.calls[2][1]).toBe(
      "Successfully updated service name",
    );
  });

  it("should redirect to the service-information page when no data in the session", async () => {
    req.session.editServiceInfo = undefined;

    await postConfirmEditServiceInfo(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      "/services/service-1/service-information",
    );
  });

  it("should error if it attempts to change a name to one that already exists", async () => {
    req.session.editServiceInfo = {
      name: "service two",
    };
    await postConfirmEditServiceInfo(req, res);

    expect(updateService.mock.calls).toHaveLength(0);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      "/services/service-1/service-information",
    );
  });

  it("should succeed if it attempts to change the capitalisation of the existing service", async () => {
    req.session.editServiceInfo = {
      name: "SeRViCE OnE",
    };
    await postConfirmEditServiceInfo(req, res);

    expect(listRolesOfService.mock.calls).toHaveLength(1);
    expect(updateRole.mock.calls).toHaveLength(1);
    expect(updateService.mock.calls).toHaveLength(1);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      "/services/service-1/service-information",
    );
  });

  it("should update internal manage roles if the name has changed", async () => {
    await postConfirmEditServiceInfo(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      "/services/service-1/service-information",
    );
    expect(res.flash.mock.calls).toHaveLength(3);
    expect(res.flash.mock.calls[0][0]).toBe("title");
    expect(res.flash.mock.calls[0][1]).toBe("Success");
    expect(res.flash.mock.calls[1][0]).toBe("heading");
    expect(res.flash.mock.calls[1][1]).toBe(
      "Service updated: new service name",
    );
    expect(res.flash.mock.calls[2][0]).toBe("message");
    expect(res.flash.mock.calls[2][1]).toBe(
      "Successfully updated service name",
    );
  });

  it("should flash that description has changed when only description changed", async () => {
    req.session.editServiceInfo = {
      description: "new service description",
    };

    await postConfirmEditServiceInfo(req, res);

    expect(res.flash.mock.calls).toHaveLength(3);
    expect(res.flash.mock.calls[2][0]).toBe("message");
    expect(res.flash.mock.calls[2][1]).toBe(
      "Successfully updated service description",
    );
  });

  it("should flash that both name and description has changed when both changed", async () => {
    req.session.editServiceInfo = {
      name: "new service name",
      description: "new service description",
    };

    await postConfirmEditServiceInfo(req, res);

    expect(res.flash.mock.calls).toHaveLength(3);
    expect(res.flash.mock.calls[2][0]).toBe("message");
    expect(res.flash.mock.calls[2][1]).toBe(
      "Successfully updated service name and description",
    );
  });

  it("should flash an info message if the update role fails", async () => {
    updateRole.mockImplementation(() => {
      throw new Error("Something went wrong");
    });
    await postConfirmEditServiceInfo(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      "/services/service-1/service-information",
    );
    expect(res.flash.mock.calls).toHaveLength(6);
    expect(res.flash.mock.calls[0][0]).toBe("title");
    expect(res.flash.mock.calls[0][1]).toBe("Info");
    expect(res.flash.mock.calls[1][0]).toBe("heading");
    expect(res.flash.mock.calls[1][1]).toBe("Role failed to update");
    expect(res.flash.mock.calls[2][0]).toBe("message");
    expect(res.flash.mock.calls[2][1]).toBe(
      "An internal role failed to update.  Please notify us of this.",
    );
  });
});
