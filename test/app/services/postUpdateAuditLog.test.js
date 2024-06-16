/* eslint-disable global-require */
jest.mock("./../../../src/infrastructure/config", () => require("../../utils").configMockFactory());
jest.mock("../../../src/app/services/utils", () => require("../../utils").getPartialMock("src/app/services/utils", ["getReturnOrgId"]));
/* eslint-enable global-require */
jest.mock("../../../src/infrastructure/audit", () => ({
  api: {
    updateAuditLogs: jest.fn(),
  },
}));

const { updateAuditLogs } = require("../../../src/infrastructure/audit").api;
const { getRequestMock, getResponseMock } = require("../../utils");
const postUpdateAuditLog = require("../../../src/app/services/postUpdateAuditLog");

describe("When requesting to update a user's audit log", () => {
  let req;
  const res = getResponseMock();

  beforeEach(() => {
    updateAuditLogs.mockReset();
    req = getRequestMock();
    res.mockResetAll();
  });

  it("calls the audit API updateAuditLogs method", async () => {
    await postUpdateAuditLog(req, res);
    expect(updateAuditLogs).toHaveBeenCalled();
  });

  it("should redirect to the user's audit list without a returnOrg query string, if the returnOrg ID is not set", async () => {
    req.query.returnOrg = undefined;
    await postUpdateAuditLog(req, res);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`/services/${req.params.sid}/users/${req.params.uid}/audit`);
  });

  it("should redirect to the user's audit list without a returnOrg query string, if the returnOrg ID is invalid", async () => {
    req.query.returnOrg = "foo";
    await postUpdateAuditLog(req, res);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`/services/${req.params.sid}/users/${req.params.uid}/audit`);
  });

  it("should redirect to the user's audit list with a returnOrg query string, if the returnOrg ID is valid", async () => {
    const orgId = "7bf1de6d-4799-46f7-ab50-32359f2566ac";
    req.query.returnOrg = orgId;
    await postUpdateAuditLog(req, res);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`/services/${req.params.sid}/users/${req.params.uid}/audit?returnOrg=${orgId}`);
  });
});
