const mockUtils = require("../../utils");

jest.mock("./../../../src/infrastructure/config", () =>
  mockUtils.configMockFactory(),
);

const { getGrantTypes } = require("./../../../src/app/services/serviceConfig");

describe("when determining the grant types to set", () => {
  it("should return authorization code grant type with refresh token for hybrid or authorization code flow", () => {
    const result = getGrantTypes({
      isHybridFlow: true,
      isAuthorisationCodeFlow: false,
      isImplicitFlow: false,
      refreshToken: "refresh_token",
      oldService: null,
    });
    expect(result).toEqual(["authorization_code", "implicit", "refresh_token"]);
  });
  it("should return authorization code grant type without refresh token for hybrid or authorization code flow", () => {
    const result = getGrantTypes({
      isHybridFlow: true,
      isAuthorisationCodeFlow: false,
      isImplicitFlow: false,
      refreshToken: null,
      oldService: null,
    });
    expect(result).toEqual(["authorization_code", "implicit"]);
  });
  it("should return implicit grant type for implicit flow", () => {
    const result = getGrantTypes({
      isHybridFlow: false,
      isAuthorisationCodeFlow: false,
      isImplicitFlow: true,
      refreshToken: null,
      oldService: null,
    });
    expect(result).toEqual(["implicit"]);
  });
  it("should return authorisation grant type for authorisation flow", () => {
    const result = getGrantTypes({
      isHybridFlow: false,
      isAuthorisationCodeFlow: true,
      isImplicitFlow: false,
      refreshToken: null,
      oldService: null,
    });
    expect(result).toEqual(["authorization_code"]);
  });
  it("should return old service grant types if no flow conditions are met", () => {
    const oldService = { grantTypes: ["some_grant_type"] };
    const result = getGrantTypes({
      isHybridFlow: false,
      isAuthorisationCodeFlow: false,
      isImplicitFlow: false,
      refreshToken: null,
      oldService,
    });
    expect(result).toEqual(["some_grant_type"]);
  });
  it("should return an empty array if no flow conditions are met and oldService is undefined", () => {
    const result = getGrantTypes({
      isHybridFlow: false,
      isAuthorisationCodeFlow: false,
      isImplicitFlow: false,
      refreshToken: null,
      oldService: undefined,
    });
    expect(result).toEqual([]);
  });
});
