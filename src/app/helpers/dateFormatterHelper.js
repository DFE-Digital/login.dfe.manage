const moment = require("moment");

const datetimeFormats = {
  shortDateFormat: "DD MMM YYYY",
  longDateFormat: "DD MMM YYYY hh:mma",
};

/**
 * Returns a formatted time string for a given date.
 * @param {number|Date} [value] - The timestamp (in ms) or Date object to format.
 * @param {string} [format] - The date format string to use.
 * @returns {string} Time formatted Eg. "DD MMM YYYY hh:mma" or "DD MMM YYYY".
 * @throws {TypeError} If the provided value is not a valid date or timestamp.
 */
function getFormattedDate(value, format) {
  const dateValue = new Date(value);

  // Ensure the value is a valid date
  if (Number.isNaN(dateValue.getTime())) {
    throw new TypeError("Invalid date or timestamp");
  }

  return moment(dateValue).format(format);
}

function dateFormat(date, formatKey) {
  return getFormattedDate(date, datetimeFormats[formatKey]);
}

/**
 * Finds the index of the active banner based on the current time.
 * @param {Array} banners - The list of banners.
 * @returns {number} The index of the active banner, or -1 if no active banner is found.
 */
function findActiveBannerIndex(banners, now = moment()) {
  return banners.findIndex((banner) =>
    moment(now).isBetween(banner.validFrom, banner.validTo),
  );
}

module.exports = {
  getFormattedDate,
  dateFormat,
  findActiveBannerIndex,
};
