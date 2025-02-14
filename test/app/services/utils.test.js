const {
  getReturnOrgId,
  doesUserHaveRole,
} = require("../../../src/app/services/utils");
const { getRequestMock } = require("../../utils");

jest.mock("../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);

describe("getReturnOrgId utility function", () => {
  it("returns null if requestQuery is undefined", () => {
    const requestQuery = undefined;
    expect(getReturnOrgId(requestQuery)).toBe(null);
  });

  it("returns null if requestQuery is falsy", () => {
    const testValues = [{}, null, false, ""];
    testValues.forEach((value) => {
      expect(getReturnOrgId(value)).toBe(null);
    });
  });

  it("returns null if requestQuery doesn't have a property named returnOrg", () => {
    expect(getReturnOrgId({ foo: "bar" })).toBe(null);
  });

  it("returns null if requestQuery has a property named returnOrg but its value isn't a string", () => {
    const testValues = [null, {}, [], 12345, new Set()];
    testValues.forEach((value) => {
      expect(getReturnOrgId({ returnOrg: value })).toBe(null);
    });
  });

  it("returns null if requestQuery has a property named returnOrg but its value isn't in UUID format", () => {
    const testValues = [
      "1234",
      "abcd",
      "53806309851379017890",
      "---__-_-",
      "abcd-efg-hij",
    ];
    testValues.forEach((value) => {
      expect(getReturnOrgId({ returnOrg: value })).toBe(null);
    });
  });

  it("returns the UUID if requestQuery has a property named returnOrg and its value is in UUID format", () => {
    const testValues = [
      "92c653b1-2fc0-42b0-82c4-3f6d9f76e7c3",
      "c6a8671e-0f7f-4579-956c-288ee31250a4",
      "ba6afe2a-a4e7-4efe-80a7-5e6e90203d88",
      "17d34851-1921-4e97-8493-d4bc08cf5db8",
      "05a0bd5f-2134-4e98-8895-e77af36f7415",
    ];
    testValues.forEach((value) => {
      expect(getReturnOrgId({ returnOrg: value })).toBe(value);
    });
  });
});

describe("doesUserHaveRole utility function", () => {
  let req;
  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service-1",
        pid: "policy-1",
      },
      userServices: {
        roles: [
          {
            id: "E6B7C861-7D76-4D75-BA23-26E4A89B9E4E",
            name: "Test service - Service Configuration",
            code: "service-1_serviceconfig",
            numericId: "23413",
            status: { id: 1 },
          },
        ],
      },
    });
  });

  it("returns true if code is present in userServices.roles", () => {
    const result = doesUserHaveRole(req, "service-1_serviceconfig");
    expect(result).toBe(true);
  });

  it("returns false if code is present in userServices.roles", () => {
    const result = doesUserHaveRole(req, "not-in-user-services");
    expect(result).toBe(false);
  });
});
