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

const {
  SERVICE_CONFIG_CHANGES_SUMMARY_DETAILS,
} = require("./../../../src/constants/serviceConfigConstants");

describe("SERVICE_CONFIG_CHANGES_SUMMARY_DETAILS", () => {
  it("contains an isServiceHidden entry", () => {
    expect(
      SERVICE_CONFIG_CHANGES_SUMMARY_DETAILS.isServiceHidden,
    ).toBeDefined();
  });

  it("isServiceHidden has displayOrder 0 so it renders first on the review page", () => {
    expect(
      SERVICE_CONFIG_CHANGES_SUMMARY_DETAILS.isServiceHidden.displayOrder,
    ).toBe(0);
  });

  it("isServiceHidden changeLink points to its form group anchor", () => {
    expect(
      SERVICE_CONFIG_CHANGES_SUMMARY_DETAILS.isServiceHidden.changeLink,
    ).toContain("#isServiceHidden-form-group");
  });
});

const {
  isServiceHiddenFromDb,
} = require("./../../../src/app/services/serviceConfig");

describe("isServiceHiddenFromDb", () => {
  it("returns true for an id-only service with all four flags set to truthy strings", () => {
    expect(
      isServiceHiddenFromDb({
        isIdOnlyService: true,
        isHiddenService: 1,
        relyingParty: {
          params: {
            hideApprover: "true",
            hideSupport: "true",
            helpHidden: "true",
          },
        },
      }),
    ).toBe(true);
  });

  it("returns false for an id-only service when isHiddenService is 0", () => {
    expect(
      isServiceHiddenFromDb({
        isIdOnlyService: true,
        isHiddenService: 0,
        relyingParty: {
          params: {
            hideApprover: "true",
            hideSupport: "true",
            helpHidden: "true",
          },
        },
      }),
    ).toBe(false);
  });

  it("returns true for a role-based service when all three params are truthy strings", () => {
    expect(
      isServiceHiddenFromDb({
        isIdOnlyService: false,
        relyingParty: {
          params: {
            hideApprover: "true",
            hideSupport: "true",
            helpHidden: "true",
          },
        },
      }),
    ).toBe(true);
  });

  it("returns false for a role-based service when hideSupport is false", () => {
    expect(
      isServiceHiddenFromDb({
        isIdOnlyService: false,
        relyingParty: {
          params: {
            hideApprover: "true",
            hideSupport: "false",
            helpHidden: "true",
          },
        },
      }),
    ).toBe(false);
  });

  it("returns false when all params are absent", () => {
    expect(
      isServiceHiddenFromDb({
        isIdOnlyService: false,
        relyingParty: { params: {} },
      }),
    ).toBe(false);
  });

  it("treats boolean true as truthy", () => {
    expect(
      isServiceHiddenFromDb({
        isIdOnlyService: false,
        relyingParty: {
          params: { hideApprover: true, hideSupport: true, helpHidden: true },
        },
      }),
    ).toBe(true);
  });

  it("treats integer 1 as truthy", () => {
    expect(
      isServiceHiddenFromDb({
        isIdOnlyService: false,
        relyingParty: {
          params: { hideApprover: 1, hideSupport: 1, helpHidden: 1 },
        },
      }),
    ).toBe(true);
  });
});
