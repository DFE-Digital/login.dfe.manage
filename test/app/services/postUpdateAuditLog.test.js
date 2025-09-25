jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("../../../src/app/services/utils", () =>
  require("../../utils").getPartialMock("src/app/services/utils", [
    "getReturnOrgId",
    "getReturnUrl",
  ]),
);

const { getRequestMock, getResponseMock } = require("../../utils");
const postUpdateAuditLog = require("../../../src/app/services/postUpdateAuditLog");

const unmockedFetch = globalThis.fetch;

describe("When requesting to update a user's audit log", () => {
  let req;
  const res = getResponseMock();

  beforeEach(() => {
    req = getRequestMock();
    res.mockResetAll();

    const mockedFetch = jest.fn().mockResolvedValue({
      status: 200,
      statusText: "OK",
      ok: true,
    });
    globalThis.fetch = mockedFetch;
  });

  afterAll(() => {
    globalThis.fetch = unmockedFetch;
  });

  it("calls fetch with expected URL", async () => {
    const mockedFetch = jest.fn().mockResolvedValue({
      status: 200,
      statusText: "OK",
      ok: true,
    });
    globalThis.fetch = mockedFetch;

    process.env.AUDIT_HTTP_TRIGGER_URL = "https://localhost/update-audit";

    await postUpdateAuditLog(req, res);

    expect(mockedFetch).toHaveBeenCalledWith("https://localhost/update-audit", {
      method: "POST",
    });
  });

  it("should redirect to the user's audit list without a returnOrg query string, if the returnOrg ID is not set", async () => {
    req.query.returnOrg = undefined;
    await postUpdateAuditLog(req, res);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/services/${req.params.sid}/users/${req.params.uid}/audit`,
    );
  });

  it("should redirect to the user's audit list without a returnOrg query string, if the returnOrg ID is invalid", async () => {
    req.query.returnOrg = "foo";
    await postUpdateAuditLog(req, res);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/services/${req.params.sid}/users/${req.params.uid}/audit`,
    );
  });

  it("should redirect to the user's audit list with a returnOrg query string, if the returnOrg ID is valid", async () => {
    const orgId = "7bf1de6d-4799-46f7-ab50-32359f2566ac";
    req.query.returnOrg = orgId;
    await postUpdateAuditLog(req, res);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/services/${req.params.sid}/users/${req.params.uid}/audit?returnOrg=${orgId}`,
    );
  });
});
