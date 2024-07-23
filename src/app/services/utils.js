const { AUTHENTICATION_FLOWS, AUTHENTICATION_FLOWS_PATTERNS } = require("../../constants/serviceConfigConstants");
const { getSearchDetailsForUserById } = require("../../infrastructure/search");
const { getInvitation, getUserById } = require("../../infrastructure/directories");
const { getServicesForUser } = require("../../infrastructure/access");
const { mapUserStatus } = require("../../infrastructure/utils");
const { getOrganisationByIdV2 } = require("../../infrastructure/organisations");
const { mapAsync } = require("../../utils/asyncHelpers");
const config = require("../../infrastructure/config");
const { getServiceById } = require("../../infrastructure/applications/api");

const mapUserToSupportModel = (user, userFromSearch) => ({
  id: user.sub,
  name: `${user.given_name} ${user.family_name}`,
  firstName: user.given_name,
  lastName: user.family_name,
  email: user.email,
  organisation: userFromSearch.primaryOrganisation
    ? {
      name: userFromSearch.primaryOrganisation,
    }
    : null,
  organisations: userFromSearch.organisations,
  lastLogin: userFromSearch.lastLogin ? new Date(userFromSearch.lastLogin) : null,
  successfulLoginsInPast12Months: userFromSearch.numberOfSuccessfulLoginsInPast12Months,
  status: mapUserStatus(userFromSearch.status.id, userFromSearch.statusLastChangedOn),
  pendingEmail: userFromSearch.pendingEmail,
});

const getUserDetailsById = async (uid, correlationId) => {
  if (uid.startsWith("inv-")) {
    const invitation = await getInvitation(uid.substr(4), correlationId);
    return {
      id: uid,
      name: `${invitation.firstName} ${invitation.lastName}`,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      email: invitation.email,
      lastLogin: null,
      status: invitation.deactivated ? mapUserStatus(-2) : mapUserStatus(-1),
      loginsInPast12Months: {
        successful: 0,
      },
      deactivated: invitation.deactivated,
    };
  }
  const userSearch = await getSearchDetailsForUserById(uid);
  const rawUser = await getUserById(uid, correlationId);
  const user = mapUserToSupportModel(rawUser, userSearch);
  const serviceDetails = await getServicesForUser(uid, correlationId);

  const ktsDetails = serviceDetails ? serviceDetails.find((c) => c.serviceId.toLowerCase() === config.serviceMapping.key2SuccessServiceId.toLowerCase()) : undefined;
  let externalIdentifier = "";
  if (ktsDetails && ktsDetails.identifiers) {
    const key = ktsDetails.identifiers.find((a) => a.key === "k2s-id");
    if (key) {
      externalIdentifier = key.value;
    }
  }

  return {
    id: uid,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    lastLogin: user.lastLogin,
    status: user.status,
    loginsInPast12Months: {
      successful: user.successfulLoginsInPast12Months,
    },
    serviceId: config.serviceMapping.key2SuccessServiceId,
    orgId: ktsDetails ? ktsDetails.organisationId : "",
    ktsId: externalIdentifier,
    pendingEmail: user.pendingEmail,
  };
};

const getUserDetails = async (req) => getUserDetailsById(req.params.uid, req.id);

const getFriendlyUser = async (userId, correlationId) => {
  const user = await getUserById(userId, correlationId);
  if (!user) {
    return userId;
  }

  return `${user.given_name} ${user.family_name} (${user.email})`;
};

const getFriendlyOrganisation = async (organisationId, correlationId) => {
  const organisation = await getOrganisationByIdV2(organisationId, correlationId);
  if (!organisation) {
    return organisationId;
  }
  const identifiers = [
    { label: "URN", value: organisation.urn },
    { label: "UID", value: organisation.uid },
    { label: "UPIN", value: organisation.upin },
    { label: "UKPRN", value: organisation.ukprn },
    { label: "type", value: organisation.category.name },
  ]
    .filter((x) => x.value)
    .map((x) => `${x.label}: ${x.value}`)
    .join(", ");

  return `${organisation.name} (${identifiers})`;
};

const getFriendlyOrganisationCategory = async (categoryId) => {
  const categories = [
    { id: "001", name: "Establishment" },
    { id: "002", name: "Local Authority" },
    { id: "003", name: "Other Legacy Organisations" },
    { id: "008", name: "Other Stakeholders" },
    { id: "009", name: "Training Providers" },
    { id: "010", name: "Multi-Academy Trust" },
    { id: "011", name: "Government" },
    { id: "012", name: "Other GIAS Stakeholder" },
    { id: "013", name: "Single-Academy Trust" },
    { id: "014", name: "Secure Single-Academy Trust" },
    { id: "050", name: "Software Suppliers" },
    { id: "051", name: "PIMS Training Providers" },
    { id: "052", name: "Billing Authority" },
    { id: "053", name: "Youth Custody Service" },
  ];

  const category = categories.find((x) => x.id === categoryId);
  if (category) {
    return category.name;
  }
  return categoryId;
};
const getFriendlyOrganisationPhaseOfEducation = async (phaseOfEducationId) => {
  const phasesOfEducation = [
    { id: "0", name: "Not applicable" },
    { id: "1", name: "Nursery" },
    { id: "2", name: "Primary" },
    { id: "3", name: "Middle deemed primary" },
    { id: "4", name: "Secondary" },
    { id: "5", name: "Middle deemed secondary" },
    { id: "6", name: "16 plus" },
    { id: "7", name: "All through" },
  ];

  const phaseOfEducation = phasesOfEducation.find((x) => x.id === phaseOfEducationId);
  if (phaseOfEducation) {
    return phaseOfEducation.name;
  }
  return phaseOfEducationId;
};
const getFriendlyOrganisationRegion = async (regionCodeId) => {
  const regionCodes = [
    { id: "A", name: "North East" },
    { id: "B", name: "North West" },
    { id: "D", name: "Yorkshire and the Humber" },
    { id: "E", name: "East Midlands" },
    { id: "F", name: "West Midlands" },
    { id: "G", name: "East of England" },
    { id: "H", name: "London" },
    { id: "J", name: "South East" },
    { id: "K", name: "South West" },
    { id: "W", name: "Wales (pseudo)" },
    { id: "Z", name: "Not Applicable" },
  ];

  const regionCode = regionCodes.find((x) => x.id === regionCodeId);
  if (regionCode) {
    return regionCode.name;
  }
  return regionCodeId;
};
const getFriendlyOrganisationStatus = async (statusId) => {
  const organisationStatus = [
    { id: "0", name: "Hidden" },
    { id: "1", name: "Open" },
    { id: "2", name: "Closed" },
    { id: "3", name: "Proposed to close" },
    { id: "4", name: "Proposed to open" },
    { id: "5", name: "Dissolved" },
    { id: "6", name: "In Liquidation" },
    { id: "8", name: "Locked Duplicate" },
    { id: "9", name: "Created in error" },
    { id: "10", name: "Locked restructure" },
  ];

  const status = organisationStatus.find((x) => x.id === statusId);
  if (status) {
    return status.name;
  }
  return statusId;
};
const getFriendlyOrganisationType = async (typeId) => {
  const establishmentTypes = [
    { id: "01", name: "Community School" },
    { id: "02", name: "Voluntary Aided School" },
    { id: "03", name: "Voluntary Controlled School" },
    { id: "05", name: "Foundation School" },
    { id: "06", name: "City Technology College" },
    { id: "07", name: "Community Special School" },
    { id: "08", name: "Non-Maintained Special School" },
    { id: "10", name: "Other Independent Special School" },
    { id: "11", name: "Other Independent School" },
    { id: "12", name: "Foundation Special School" },
    { id: "14", name: "Pupil Referral Unit" },
    { id: "15", name: "LA Nursery School" },
    { id: "18", name: "Further Education" },
    { id: "24", name: "Secure Units" },
    { id: "25", name: "Offshore Schools" },
    { id: "26", name: "Service Childrens Education" },
    { id: "27", name: "Miscellaneous" },
    { id: "28", name: "Academy Sponsor Led" },
    { id: "29", name: "Higher education institution" },
    { id: "30", name: "Welsh Establishment" },
    { id: "31", name: "Sixth Form Centres" },
    { id: "32", name: "Special Post 16 Institution" },
    { id: "33", name: "Academy Special Sponsor Led" },
    { id: "34", name: "Academy Converter" },
    { id: "35", name: "Free Schools" },
    { id: "36", name: "Free Schools Special" },
    { id: "37", name: "British Overseas Schools" },
    { id: "38", name: "Free Schools - Alternative Provision" },
    { id: "39", name: "Free Schools - 16-19" },
    { id: "40", name: "University Technical College" },
    { id: "41", name: "Studio Schools" },
    { id: "42", name: "Academy Alternative Provision Converter" },
    { id: "43", name: "Academy Alternative Provision Sponsor Led" },
    { id: "44", name: "Academy Special Converter" },
    { id: "45", name: "Academy 16-19 Converter" },
    { id: "46", name: "Academy 16-19 Sponsor Led" },
    { id: "47", name: "Children's Centre" },
    { id: "48", name: "Children's Centre Linked Site" },
    { id: "56", name: "Institution funded by other government department" },
    { id: "57", name: "Academy secure 16 to 19" },
  ];

  const establishmentType = establishmentTypes.find((x) => x.id === typeId);
  if (establishmentType) {
    return establishmentType.name;
  }
  return typeId;
};

const getFriendlyFieldName = (fieldName) => {
  const conversions = [
    { source: "email", friendly: "User email" },
    { source: "id", friendly: "User" },
    { source: "organisation.category.id", friendly: "Organisation category" },
    { source: "organisation.id", friendly: "Organisation" },
    { source: "organisation.IsOnAPAR", friendly: "Organisation on APAR" },
    { source: "organisation.localAuthority.id", friendly: "Organisation Local Authority number" },
    { source: "organisation.name", friendly: "Organisation name" },
    { source: "organisation.phaseOfEducation.id", friendly: "Organisation phase of education" },
    { source: "organisation.region.id", friendly: "Organisation region" },
    { source: "organisation.status.id", friendly: "Organisation status" },
    { source: "organisation.type.id", friendly: "Organisation type" },
    { source: "organisation.ukprn", friendly: "Organisation UKPRN" },
    { source: "organisation.urn", friendly: "Organisation URN" },
    { source: "role.id", friendly: "User role ID" },
    { source: "role.name", friendly: "User role name" },
  ];

  const conversion = conversions.find((x) => x.source === fieldName);
  if (conversion) {
    return conversion.friendly;
  }
  return fieldName;
};

const getFriendlyValues = async (fieldName, values, correlationId) => {
  const conversions = [
    { source: "id", valueConverter: getFriendlyUser },
    { source: "organisation.category.id", valueConverter: getFriendlyOrganisationCategory },
    { source: "organisation.id", valueConverter: getFriendlyOrganisation },
    { source: "organisation.phaseOfEducation.id", valueConverter: getFriendlyOrganisationPhaseOfEducation },
    { source: "organisation.region.id", valueConverter: getFriendlyOrganisationRegion },
    { source: "organisation.status.id", valueConverter: getFriendlyOrganisationStatus },
    { source: "organisation.type.id", valueConverter: getFriendlyOrganisationType },
  ];

  const conversion = conversions.find((x) => x.source === fieldName);
  if (conversion) {
    const convertedValues = await mapAsync(values, (value) => conversion.valueConverter(value, correlationId));
    return convertedValues;
  }
  return values;
};

const delay = async (milliseconds) => new Promise((resolve) => {
  setTimeout(resolve, milliseconds);
});

const waitForIndexToUpdate = async (uid, updatedCheck) => {
  const abandonTime = Date.now() + 10000;
  let hasBeenUpdated = false;
  while (!hasBeenUpdated && Date.now() < abandonTime) {
    const updated = await getSearchDetailsForUserById(uid);
    if (updatedCheck) {
      hasBeenUpdated = updatedCheck(updated);
    } else {
      hasBeenUpdated = updated;
    }
    if (!hasBeenUpdated) {
      await delay(200);
    }
  }
};

const getUserServiceRoles = async (req) => {
  const allUserRoles = req.userServices.roles.map((role) => ({
    serviceId: role.code.substr(0, role.code.indexOf("_")),
    role: role.code.substr(role.code.lastIndexOf("_") + 1),
  }));
  const userRolesForService = allUserRoles.filter((x) => x.serviceId === req.params.sid);
  return userRolesForService.map((x) => x.role);
};

const unpackMultiSelect = (parameter) => {
  if (!parameter) {
    return [];
  }
  if (!(parameter instanceof Array)) {
    return parameter.split(",");
  }
  return parameter;
};

const isSelected = (source, target) => source.some((x) => x.toLowerCase() === target.toLowerCase());

const getParamsSource = (reqMethod, reqBody, reqQuery) => (reqMethod.toUpperCase() === "POST" ? reqBody : reqQuery);

const buildFilters = (paramsSource, ...filterParams) => {
  const filters = {};

  filterParams.forEach((param) => {
    const selectedValues = unpackMultiSelect(paramsSource[param]);
    if (selectedValues) {
      filters[param] = selectedValues;
    }
  });

  return Object.keys(filters).length > 0 ? filters : undefined;
};

function mapLastLoginValuesToDateValues(values) {
  const now = new Date();

  return values.map((value) => {
    let result;
    let lastWeek;
    let lastMonth;
    let last3Months;
    let last6Months;

    switch (value) {
      case "lastWeek":
        lastWeek = new Date(now);
        lastWeek.setDate(now.getDate() - 7);
        result = lastWeek.getTime();
        break;
      case "lastMonth":
        lastMonth = new Date(now);
        lastMonth.setMonth(now.getMonth() - 1);
        result = lastMonth.getTime();
        break;
      case "last3Months":
        last3Months = new Date(now);
        last3Months.setMonth(now.getMonth() - 3);
        result = last3Months.getTime();
        break;
      case "last6Months":
        last6Months = new Date(now);
        last6Months.setMonth(now.getMonth() - 6);
        result = last6Months.getTime();
        break;
      case "onePlusYear":
        result = 1;
        break;
      case "never":
        result = 0;
        break;
      default:
        result = null;
        break;
    }
    return result;
  });
}

const getSortInfo = (paramsSource, sortKeys) => {
  let sortBy = "name";
  if (paramsSource.sort) {
    sortBy = paramsSource.sort.toLowerCase();
  }

  let sortAsc = true;
  if (paramsSource.sortDir) {
    sortAsc = paramsSource.sortDir.toLowerCase() === "asc";
  }

  const sort = sortKeys.reduce((acc, key) => {
    const lowerCaseKey = key.toLowerCase();
    let nextDirection = "asc";
    let applied = false;

    if (sortBy === lowerCaseKey) {
      applied = true;
      if (sortAsc) {
        nextDirection = "desc";
      } else {
        nextDirection = "asc";
      }
    }

    acc[lowerCaseKey] = {
      nextDirection,
      applied,
    };

    return acc;
  }, {});

  return {
    sortBy,
    sortAsc,
    sort,
  };
};

const getValidPageNumber = (pageSource) => {
  const pageNumber = parseInt(pageSource, 10) || 1;
  return Number.isNaN(pageNumber) ? 1 : pageNumber;
};

const objectToQueryString = (obj) => Object.entries(obj)
  .flatMap(([key, value]) => {
    if (Array.isArray(value)) {
      return value.filter((v) => v !== undefined && v !== null && v !== "").map((v) => `${key}=${v}`);
    }
    if (value !== undefined && value !== null && value !== "") {
      return `${key}=${value}`;
    }
    return [];
  })
  .join("&");

const arraysEqual = (a, b) => {
  if (a.length !== b.length) return false;
  return a.every((element, index) => element === b[index]);
};

const determineAuthFlowByRespType = (responseTypes) => {
  if (!responseTypes) return AUTHENTICATION_FLOWS.UNKNOWN_FLOW;

  const sortedResponseTypes = [...responseTypes].sort();

  const foundPattern = AUTHENTICATION_FLOWS_PATTERNS.find((pattern) => arraysEqual(pattern.types.sort(), sortedResponseTypes));

  return foundPattern ? foundPattern.flow : AUTHENTICATION_FLOWS.UNKNOWN_FLOW;
};

const processConfigurationTypes = (configurationTypes) => {
  if (configurationTypes === undefined) {
    return undefined;
  }
  return Array.isArray(configurationTypes) ? configurationTypes : [configurationTypes];
};

const processRedirectUris = (uris) => {
  let processedUris = uris;
  if (processedUris) {
    processedUris = Array.isArray(processedUris) ? processedUris : [processedUris];
    processedUris = processedUris.map((x) => x.trim()).filter((x) => x !== "");
  }
  return processedUris;
};
const _unescape = (html) => {
  let returnText = html;
  returnText = returnText.replace(/&#39;/gi, "'");
  returnText = returnText.replace(/&nbsp;/gi, " ");
  returnText = returnText.replace(/&amp;/gi, "&");
  returnText = returnText.replace(/&quot;/gi, '"');
  returnText = returnText.replace(/&lt;/gi, "<");
  returnText = returnText.replace(/&gt;/gi, ">");
  return returnText;
};
const isCorrectProtocol = async (urlValidator) => urlValidator
    .isValidProtocal()
    .then((result) => result)
    .catch((err) => err);
const isCorrectLength = async (urlValidator) => urlValidator
    .isCorrectLength(200)
    .then((result) => result)
    .catch((err) => err);
const isValidUrl = async (urlValidator) => urlValidator
    .IsValidUrl()
    .then((result) => result)
    .catch((err) => err);

const checkClientId = async (clientId, reqId) => {
  const service = await getServiceById(clientId, reqId);
  return !!service;
};

const getReturnOrgId = (requestQuery) => {
  if (
    requestQuery
    && Object.prototype.hasOwnProperty.call(requestQuery, "returnOrg")
    && typeof requestQuery.returnOrg === "string"
    && requestQuery.returnOrg.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  ) {
    return requestQuery.returnOrg;
  }
  return null;
};

const getReturnUrl = (requestQuery, url) => {
  const returnOrgId = getReturnOrgId(requestQuery);
  if (returnOrgId !== null) {
    return `${url}?returnOrg=${returnOrgId}`;
  }
  return url;
};

module.exports = {
  mapUserToSupportModel,
  getUserDetails,
  getUserDetailsById,
  getFriendlyFieldName,
  getFriendlyValues,
  waitForIndexToUpdate,
  getUserServiceRoles,
  unpackMultiSelect,
  isSelected,
  getParamsSource,
  getSortInfo,
  getValidPageNumber,
  objectToQueryString,
  determineAuthFlowByRespType,
  processRedirectUris,
  processConfigurationTypes,
  isCorrectProtocol,
  isCorrectLength,
  isValidUrl,
  buildFilters,
  mapLastLoginValuesToDateValues,
  checkClientId,
  _unescape,
  getReturnOrgId,
  getReturnUrl,
};
