jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.api-client/services");

const { getRequestMock, getResponseMock } = require("./../../utils");
const postConfirmCreatePolicyRole = require("./../../../src/app/services/postConfirmCreatePolicyRole");
const getListRoles = require("./../../../src/app/services/listRoles");
const {
  getServicePolicyRaw,
  updateServicePolicyRaw,
  createServiceRole,
  getServiceRolesRaw,
  getServiceRaw,
  getServicePoliciesRaw,
} = require("login.dfe.api-client/services");

describe("service role create to service roles route flow", () => {
  beforeEach(() => {
    getServicePolicyRaw.mockReset();
    updateServicePolicyRaw.mockReset();
    createServiceRole.mockReset();
    getServiceRolesRaw.mockReset();
    getServiceRaw.mockReset();
    getServicePoliciesRaw.mockReset();

    getServicePolicyRaw.mockResolvedValue({
      id: "policy-1",
      name: "Policy One",
      applicationId: "service-1",
      status: { id: 1 },
      conditions: [],
      roles: [],
    });

    getServiceRolesRaw.mockResolvedValue([]);

    createServiceRole.mockResolvedValue({
      id: "role-1",
      name: "New Role",
      code: "new_role",
      status: ["1"],
    });

    updateServicePolicyRaw.mockResolvedValue(undefined);

    getServiceRaw.mockResolvedValue({
      id: "service-1",
      name: "Service One",
    });

    getServicePoliciesRaw.mockResolvedValue([
      {
        id: "policy-1",
        name: "Policy One",
        roles: [
          {
            id: "role-1",
            name: "New Role",
            code: "new_role",
          },
        ],
      },
    ]);
  });

  it("redirects to service roles route and provides nav context for the destination page", async () => {
    const postReq = getRequestMock({
      params: {
        sid: "service-1",
        pid: "policy-1",
      },
      session: {
        createPolicyRoleData: {
          appId: "service-1",
          roleName: "New Role",
          roleCode: "new_role",
        },
      },
    });
    const postRes = getResponseMock();

    await postConfirmCreatePolicyRole(postReq, postRes);

    expect(postRes.redirect).toHaveBeenCalledWith("/services/service-1/roles");

    const getReq = getRequestMock({
      params: {
        sid: "service-1",
      },
      userServices: {
        roles: [{ code: "service-1_accessManage" }],
      },
    });
    const getRes = getResponseMock();

    await getListRoles(getReq, getRes);

    const model = getRes.render.mock.calls[0][1];
    expect(model.serviceId).toBe("service-1");
    expect(model.currentNavigation).toBe("policies");
    expect(model.roles).toHaveLength(1);
    expect(model.roles[0]).toMatchObject({
      id: "role-1",
      name: "New Role",
      policies: ["Policy One"],
    });
  });

  it("returns an empty role list model when the service has no policy roles", async () => {
    getServicePoliciesRaw.mockResolvedValue([]);

    const getReq = getRequestMock({
      params: {
        sid: "service-1",
      },
      userServices: {
        roles: [{ code: "service-1_accessManage" }],
      },
    });
    const getRes = getResponseMock();

    await getListRoles(getReq, getRes);

    const model = getRes.render.mock.calls[0][1];
    expect(model.roles).toEqual([]);
    expect(model.currentNavigation).toBe("policies");
  });
});
