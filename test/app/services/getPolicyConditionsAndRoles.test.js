jest.mock("../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);

jest.mock("../../../src/infrastructure/applications");
jest.mock("../../../src/infrastructure/access");

const { getRequestMock, getResponseMock } = require("../../utils");
const getPolicyConditions = require("../../../src/app/services/getPolicyConditionsAndRoles");
const { getServiceById } = require("../../../src/infrastructure/applications");
const { getPolicyById } = require("../../../src/infrastructure/access");

const res = getResponseMock();

describe("When displaying the selected policy's conditions and roles", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: "service1",
        pid: "policy1",
      },
      userServices: {
        roles: [
          {
            code: "serviceid_serviceconfiguration",
          },
        ],
      },
    });

    getServiceById.mockReset();
    getServiceById.mockReturnValue({
      id: "service1",
      dateActivated: "10/10/2018",
      name: "service name",
      status: "active",
    });

    getPolicyById.mockReset();
    getPolicyById.mockReturnValue({
      applicationId: "service1",
      conditions: [
        {
          field: "organisation.type.id",
          operator: "is",
          value: ["46"],
        },
      ],
      roles: [
        {
          id: "test",
          name: "Test Role",
          code: "testRole",
        },
      ],
      id: "conditionId",
      name: "condition name",
    });
  });

  it("then it should return the policy conditions view", async () => {
    await getPolicyConditions(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe(
      "services/views/policyConditionsAndRoles",
    );
  });

  it("then it should include csrf token", async () => {
    await getPolicyConditions(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
    });
  });

  it("then it should get the service by id", async () => {
    await getPolicyConditions(req, res);

    expect(getServiceById.mock.calls).toHaveLength(1);
    expect(getServiceById.mock.calls[0][0]).toBe("service1");
    expect(getServiceById.mock.calls[0][1]).toBe("correlationId");
  });

  it("then it should get the policy by id", async () => {
    await getPolicyConditions(req, res);

    expect(getPolicyById.mock.calls).toHaveLength(1);
    expect(getPolicyById.mock.calls[0][0]).toBe("service1");
    expect(getPolicyById.mock.calls[0][1]).toBe("policy1");
    expect(getPolicyById.mock.calls[0][2]).toBe("correlationId");
  });

  it("then it should include the mapped policy", async () => {
    await getPolicyConditions(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      policy: {
        applicationId: "service1",
        conditions: [
          {
            field: "organisation.type.id",
            operator: "is",
            value: ["46"],
            friendlyField: "Organisation type",
            friendlyValue: ["Academy 16-19 Sponsor Led"],
          },
        ],
      },
    });
  });

  it("then it should return the roles in the policy sorted by name", async () => {
    getPolicyById.mockReturnValue({
      id: "conditionId",
      name: "condition name",
      applicationId: "service1",
      conditions: [],
      roles: [
        {
          id: "test",
          name: "Role C",
          code: "testRole1",
        },
        {
          id: "test",
          name: "Role A",
          code: "testRole2",
        },
        {
          id: "test",
          name: "Role E",
          code: "testRole3",
        },
        {
          id: "test",
          name: "Role B",
          code: "testRole4",
        },
      ],
    });

    await getPolicyConditions(req, res);
    expect(res.render.mock.calls[0][1].policy.roles[0].name).toBe("Role A");
    expect(res.render.mock.calls[0][1].policy.roles[1].name).toBe("Role B");
    expect(res.render.mock.calls[0][1].policy.roles[2].name).toBe("Role C");
    expect(res.render.mock.calls[0][1].policy.roles[3].name).toBe("Role E");
  });

  it("then it should return the condition fields in the policy sorted by friendlyField", async () => {
    getPolicyById.mockReturnValue({
      id: "conditionId",
      name: "condition name",
      applicationId: "service1",
      conditions: [
        {
          field: "Condition B",
          value: [],
        },
        {
          field: "Condition D",
          value: [],
        },
        {
          field: "Condition C",
          value: [],
        },
        {
          field: "Condition A",
          value: [],
        },
      ],
      roles: [],
    });

    await getPolicyConditions(req, res);
    expect(res.render.mock.calls[0][1].policy.conditions[0].friendlyField).toBe(
      "Condition A",
    );
    expect(res.render.mock.calls[0][1].policy.conditions[1].friendlyField).toBe(
      "Condition B",
    );
    expect(res.render.mock.calls[0][1].policy.conditions[2].friendlyField).toBe(
      "Condition C",
    );
    expect(res.render.mock.calls[0][1].policy.conditions[3].friendlyField).toBe(
      "Condition D",
    );
  });

  it("then it should return the values for a numeric condition sorted numerically", async () => {
    getPolicyById.mockReturnValue({
      id: "conditionId",
      name: "condition name",
      applicationId: "service1",
      conditions: [
        {
          field: "Condition A",
          value: ["01", "2", "1", "02", "010", "0.1"],
        },
      ],
      roles: [],
    });

    await getPolicyConditions(req, res);
    // Will sort the values parsed as numbers, so 02 === 2, and 010 === 10.
    expect(
      res.render.mock.calls[0][1].policy.conditions[0].mappedValues[0]
        .friendlyValue,
    ).toBe("0.1");
    expect(
      res.render.mock.calls[0][1].policy.conditions[0].mappedValues[1]
        .friendlyValue,
    ).toBe("01");
    expect(
      res.render.mock.calls[0][1].policy.conditions[0].mappedValues[2]
        .friendlyValue,
    ).toBe("1");
    expect(
      res.render.mock.calls[0][1].policy.conditions[0].mappedValues[3]
        .friendlyValue,
    ).toBe("2");
    expect(
      res.render.mock.calls[0][1].policy.conditions[0].mappedValues[4]
        .friendlyValue,
    ).toBe("02");
    expect(
      res.render.mock.calls[0][1].policy.conditions[0].mappedValues[5]
        .friendlyValue,
    ).toBe("010");
  });

  it("then it should return the values for an alphanumeric condition values sorted lexicographically", async () => {
    getPolicyById.mockReturnValue({
      id: "conditionId",
      name: "condition name",
      applicationId: "service1",
      conditions: [
        {
          field: "Condition A",
          value: ["D", "A", "E", "Z", "B", "D"],
        },
      ],
      roles: [],
    });

    await getPolicyConditions(req, res);
    expect(
      res.render.mock.calls[0][1].policy.conditions[0].mappedValues[0]
        .friendlyValue,
    ).toBe("A");
    expect(
      res.render.mock.calls[0][1].policy.conditions[0].mappedValues[1]
        .friendlyValue,
    ).toBe("B");
    expect(
      res.render.mock.calls[0][1].policy.conditions[0].mappedValues[2]
        .friendlyValue,
    ).toBe("D");
    expect(
      res.render.mock.calls[0][1].policy.conditions[0].mappedValues[3]
        .friendlyValue,
    ).toBe("D");
    expect(
      res.render.mock.calls[0][1].policy.conditions[0].mappedValues[4]
        .friendlyValue,
    ).toBe("E");
    expect(
      res.render.mock.calls[0][1].policy.conditions[0].mappedValues[5]
        .friendlyValue,
    ).toBe("Z");
  });
});
