jest.mock("./../../../../src/infrastructure/config", () =>
  require("../../../utils").configMockFactory(),
);
jest.mock("../../../../src/infrastructure/logger", () =>
  require("../../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.api-client/services");

const { getRequestMock, getResponseMock } = require("../../../utils");
const postConfirmCreateNewPolicy = require("../../../../src/app/services/createNewPolicy/postConfirmCreateNewPolicy");
const res = getResponseMock();

describe("when calling the postConfirmCreateNewPolicy function", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service-1",
      },
      session: {
        createNewPolicy: {
          name: "Test Policy",
          role: {
            roleName: "Test role",
            roleCode: "Test code",
          },
          condition: {
            condition: "organisation.urn",
            operator: "is",
            value: "123456",
          },
        },
      },
    });

    res.mockResetAll();
  });

  it("should flash and then redirect on success", async () => {
    await postConfirmCreateNewPolicy(req, res);

    expect(res.flash.mock.calls.length).toBe(1);
    expect(res.flash.mock.calls[0][0]).toBe("info");
    expect(res.flash.mock.calls[0][1]).toBe(
      "'Test Policy' policy was successfully created",
    );
    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`/services/service-1/policies`);
  });

  it("should redirect to policies if there is no data in the session", async () => {
    req = getRequestMock({
      params: {
        sid: "service-1",
      },
    });
    await postConfirmCreateNewPolicy(req, res);

    expect(res.redirect.mock.calls[0][0]).toBe("/services/service-1/policies");
  });
});
