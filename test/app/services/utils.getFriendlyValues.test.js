const { getFriendlyValues } = require("../../../src/app/services/utils");

jest.mock("../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("login.dfe.api-client/organisations");
jest.mock("login.dfe.api-client/users");
const { getOrganisationRaw } = require("login.dfe.api-client/organisations");
const { getUserRaw } = require("login.dfe.api-client/users");

describe("getFriendlyValues utility function", () => {
  const field = "organisation.ukprn";
  const values = ["12345678"];
  const correlationId = "correlation-id";

  beforeEach(() => {
    getUserRaw.mockReset();
    getUserRaw.mockReturnValue({
      sub: "user-1",
      email: "test-user-1@email.com",
      given_name: "Test",
      family_name: "User",
    });

    getOrganisationRaw.mockReset();
    getOrganisationRaw.mockReturnValue({
      id: "org-1",
      name: "organisation one",
      urn: "123456",
      uid: "123",
      upin: "234567",
      ukprn: "12345678",
      category: {
        name: "category name",
      },
    });
  });

  it("returns a mapped value when the field is organisation.ukprn", async () => {
    const result = await getFriendlyValues(field, values, correlationId);
    expect(result).toStrictEqual(["12345678 (Name: organisation one)"]);
  });

  it("returns the original value when the field is organisation.ukprn but the organisation is not found", async () => {
    getOrganisationRaw.mockReturnValue(undefined);
    const result = await getFriendlyValues(field, values, correlationId);
    expect(result).toStrictEqual(["12345678"]);
  });

  it("returns a mapped value when the field is id", async () => {
    const testField = "id";
    const testValues = ["user-1"];
    const result = await getFriendlyValues(
      testField,
      testValues,
      correlationId,
    );
    expect(result).toStrictEqual(["Test User (test-user-1@email.com)"]);
  });

  it("returns the original value when the field is id but the user is not found", async () => {
    getUserRaw.mockReturnValue(undefined);
    const testField = "id";
    const testValues = ["user-1"];
    const result = await getFriendlyValues(
      testField,
      testValues,
      correlationId,
    );
    expect(result).toStrictEqual(["user-1"]);
  });

  it("returns a mapped value when the field is organisation.id", async () => {
    const testField = "organisation.id";
    const testValues = ["org-1"];
    const result = await getFriendlyValues(
      testField,
      testValues,
      correlationId,
    );
    expect(result).toStrictEqual([
      "organisation one (URN: 123456, UID: 123, UPIN: 234567, UKPRN: 12345678, type: category name)",
    ]);
  });

  it("returns the original value when the field is organisation.id but the organisation is not found", async () => {
    getOrganisationRaw.mockReturnValue(undefined);
    const testField = "organisation.id";
    const testValues = ["org-1"];
    const result = await getFriendlyValues(
      testField,
      testValues,
      correlationId,
    );
    expect(result).toStrictEqual(["org-1"]);
  });

  it("returns a mapped value when the field is organisation.phaseOfEducation.id", async () => {
    const testField = "organisation.phaseOfEducation.id";
    const testValue = ["1"];
    const result = await getFriendlyValues(testField, testValue, correlationId);
    expect(result).toStrictEqual(["Nursery"]);
  });

  it("returns the original value when the field is organisation.phaseOfEducation.id but the value is not in the mapping", async () => {
    const testField = "organisation.phaseOfEducation.id";
    const testValue = ["100"];
    const result = await getFriendlyValues(testField, testValue, correlationId);
    expect(result).toStrictEqual(["100"]);
  });

  it("returns a mapped value when the field is organisation.region.id", async () => {
    const testField = "organisation.region.id";
    const testValue = ["F"];
    const result = await getFriendlyValues(testField, testValue, correlationId);
    expect(result).toStrictEqual(["West Midlands"]);
  });

  it("returns the original value when the field is organisation.region.id but the value is not in the mapping", async () => {
    const testField = "organisation.region.id";
    const testValue = ["ABC"];
    const result = await getFriendlyValues(testField, testValue, correlationId);
    expect(result).toStrictEqual(["ABC"]);
  });

  it("returns a mapped value when the field is organisation.status.id", async () => {
    const testField = "organisation.status.id";
    const testValue = ["1"];
    const result = await getFriendlyValues(testField, testValue, correlationId);
    expect(result).toStrictEqual(["Open"]);
  });

  it("returns the original value when the field is organisation.status.id but the value is not in the mapping", async () => {
    const testField = "organisation.status.id";
    const testValue = ["123"];
    const result = await getFriendlyValues(testField, testValue, correlationId);
    expect(result).toStrictEqual(["123"]);
  });

  it("returns a mapped value when the field is organisation.category.id", async () => {
    const testField = "organisation.category.id";
    const testValue = ["002"];
    const result = await getFriendlyValues(testField, testValue, correlationId);
    expect(result).toStrictEqual(["Local Authority"]);
  });

  it("returns the original value when the field is organisation.category.id but the value is not in the mapping", async () => {
    const testField = "organisation.category.id";
    const testValue = ["999"];
    const result = await getFriendlyValues(testField, testValue, correlationId);
    expect(result).toStrictEqual(["999"]);
  });

  it("returns a mapped value when the field is organisation.type.id", async () => {
    const testField = "organisation.type.id";
    const testValue = ["02"];
    const result = await getFriendlyValues(testField, testValue, correlationId);
    expect(result).toStrictEqual(["Voluntary Aided School"]);
  });

  it("returns the original value when the field is organisation.type.id but the value is not in the mapping", async () => {
    const testField = "organisation.type.id";
    const testValue = ["100"];
    const result = await getFriendlyValues(testField, testValue, correlationId);
    expect(result).toStrictEqual(["100"]);
  });
});
