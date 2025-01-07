jest.mock("./../../../src/infrastructure/config", () => require("../../utils").configMockFactory());
const { mapUserStatus } = require("../../../src/infrastructure/utils");

describe("mapUserStatus helper function", () => {
  const statuses = [
    { id: 1, description: "Active", tagColor: "green" },
    { id: 0, description: "Deactivated", tagColor: "red" },
    { id: -1, description: "Invited", tagColor: "blue" },
    { id: -2, description: "Deactivated Invitation", tagColor: "orange" },
  ];

  it("should return the correct status object when status exists", () => {
    const status = 1;
    const expected = {
      id: 1,
      description: "Active",
      tagColor: "green",
      changedOn: null,
    };

    const result = mapUserStatus(status);
    expect(result).toEqual(expected);
  });

  test.each(statuses)("should return the correct status object for status %p", (status) => {
    const expected = {
      id: status.id,
      description: status.description,
      tagColor: status.tagColor,
      changedOn: null,
    };

    const result = mapUserStatus(status.id);
    expect(result).toEqual(expected);
  });

  it("should return null when status does not exist", () => {
    const status = 999;

    const result = mapUserStatus(status);

    expect(result).toBeNull();
  });

  it("should include the changedOn date when provided", () => {
    const status = 1;
    const changedOn = "2023-10-01";
    const expected = {
      id: 1,
      description: "Active",
      tagColor: "green",
      changedOn,
    };

    const result = mapUserStatus(status, changedOn);

    expect(result).toEqual(expected);
  });

  it("should return null when status is undefined", () => {
    const status = undefined;

    const result = mapUserStatus(status);

    expect(result).toBeNull();
  });
});
