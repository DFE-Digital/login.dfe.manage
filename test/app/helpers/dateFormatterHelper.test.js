const { getFormattedDate, dateFormat, findActiveBannerIndex } = require("../../../src/app/helpers/dateFormatterHelper");

describe("Date Formatter Functions", () => {
  const testDate = new Date("2024-12-13 12:00:00.447"); // Example date

  it("Should format date correctly in short format", () => {
    const formattedDate = getFormattedDate(testDate, "DD MMM YYYY");
    expect(formattedDate).toBe("13 Dec 2024");
  });

  it("Should format date correctly in long format", () => {
    const formattedDate = getFormattedDate(testDate, "DD MMM YYYY hh:mma");
    expect(formattedDate).toBe("13 Dec 2024 12:00pm");
  });

  it("Should throw TypeError for invalid date", () => {
    expect(() => getFormattedDate("invalid date", "DD MMM YYYY")).toThrow(TypeError);
  });

  it("Should format date correctly in short format", () => {
    const formattedDate = dateFormat(testDate, "shortDateFormat");
    expect(formattedDate).toBe("13 Dec 2024");
  });

  it("Should format date correctly in long format", () => {
    const formattedDate = dateFormat(testDate, "longDateFormat");
    expect(formattedDate).toBe("13 Dec 2024 12:00pm");
  });

  it("Should find the active banner index correctly", () => {
    const banners = [
      { validFrom: "2024-12-01", validTo: "2024-12-10" },
      { validFrom: "2024-12-11", validTo: "2024-12-20" },
      { validFrom: "2024-12-21", validTo: "2024-12-30" },
    ];

    const activeIndex = findActiveBannerIndex(banners, testDate);
    expect(activeIndex).toBe(1);
  });

  it("Should return -1 when no banner is active", () => {
    const banners = [
      { validFrom: "2024-11-01", validTo: "2024-11-10" },
      { validFrom: "2024-11-11", validTo: "2024-11-20" },
      { validFrom: "2024-11-21", validTo: "2024-11-30" },
    ];

    const activeIndex = findActiveBannerIndex(banners);
    expect(activeIndex).toBe(-1);
  });
});
