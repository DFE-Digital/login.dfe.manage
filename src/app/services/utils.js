const { getSearchDetailsForUserById } = require('./../../infrastructure/search');
const { getInvitation, getUserById } = require('./../../infrastructure/directories');
const { mapUserStatus } = require('./../../infrastructure/utils');
const { getOrganisationByIdV2 } = require('./../../infrastructure/organisations');
const { mapAsync } = require('./../../utils/asyncHelpers');

const getUserDetails = async (req) => {
  const uid = req.params.uid;
  if (uid.startsWith('inv-')) {
    const invitation = await getInvitation(uid.substr(4), req.id);
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
      deactivated: invitation.deactivated
    }
  } else {
    const user = await getSearchDetailsForUserById(uid);
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
      pendingEmail: user.pendingEmail,
    }
  }
};

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
    { label: 'URN', value: organisation.urn },
    { label: 'UID', value: organisation.uid },
    { label: 'UKPRN', value: organisation.ukprn },
    { label: 'type', value: organisation.category.name },
  ].filter(x => x.value).map(x => `${x.label}: ${x.value}`).join(', ');

  return `${organisation.name} (${identifiers})`;
};

const getFriendlyOrganisationCategory = async (categoryId) => {
  const categories = [
    { id: '001', name: 'Establishment' },
    { id: '002', name: 'Local Authority' },
    { id: '003', name: 'Other Legacy Organisations' },
    { id: '008', name: 'Other Stakeholders' },
    { id: '009', name: 'Training Providers' },
    { id: '010', name: 'Multi-Academy Trust' },
    { id: '011', name: 'Government' },
    { id: '012', name: 'Other GIAS Stakeholder' },
    { id: '013', name: 'Single-Academy Trust' },
  ];

  const category = categories.find(x => x.id === categoryId);
  if (category) {
    return category.name;
  }
  return categoryId;
};
const getFriendlyOrganisationPhaseOfEducation = async (phaseOfEducationId) => {
  const phasesOfEducation = [
    { id: '0', name: 'Not applicable' },
    { id: '1', name: 'Nursery' },
    { id: '2', name: 'Primary' },
    { id: '3', name: 'Middle deemed primary' },
    { id: '4', name: 'Secondary' },
    { id: '5', name: 'Middle deemed secondary' },
    { id: '6', name: '16 plus' },
    { id: '7', name: 'All through' },
  ];

  const phaseOfEducation = phasesOfEducation.find(x => x.id === phaseOfEducationId);
  if (phaseOfEducation) {
    return phaseOfEducation.name;
  }
  return phaseOfEducationId;
};
const getFriendlyOrganisationRegion = async (regionCodeId) => {
  const regionCodes = [
    { id: 'A', name: 'North East' },
    { id: 'B', name: 'North West' },
    { id: 'D', name: 'Yorkshire and the Humber' },
    { id: 'E', name: 'East Midlands' },
    { id: 'F', name: 'West Midlands' },
    { id: 'G', name: 'East of England' },
    { id: 'H', name: 'London' },
    { id: 'J', name: 'South East' },
    { id: 'K', name: 'South West' },
    { id: 'W', name: 'Wales (pseudo)' },
    { id: 'Z', name: 'Not Applicable' },
  ];

  const regionCode = regionCodes.find(x => x.id === regionCodeId);
  if (regionCode) {
    return regionCode.name;
  }
  return regionCodeId;
};
const getFriendlyOrganisationStatus = async (statusId) => {
  const organisationStatus = [
    { id: '0', name: 'Hidden' },
    { id: '1', name: 'Open' },
    { id: '2', name: 'Closed' },
    { id: '3', name: 'Proposed to close' },
    { id: '4', name: 'Proposed to open' },
  ];

  const status = organisationStatus.find(x => x.id === statusId);
  if (status) {
    return status.name;
  }
  return statusId;
};
const getFriendlyOrganisationType = async (typeId) => {
  const establishmentTypes = [
    { id: '01', name: 'Community School' },
    { id: '02', name: 'Voluntary Aided School' },
    { id: '03', name: 'Voluntary Controlled School' },
    { id: '05', name: 'Foundation School' },
    { id: '06', name: 'City Technology College' },
    { id: '07', name: 'Community Special School' },
    { id: '08', name: 'Non-Maintained Special School' },
    { id: '10', name: 'Other Independent Special School' },
    { id: '11', name: 'Other Independent School' },
    { id: '12', name: 'Foundation Special School' },
    { id: '14', name: 'Pupil Referral Unit' },
    { id: '15', name: 'LA Nursery School' },
    { id: '18', name: 'Further Education' },
    { id: '24', name: 'Secure Units' },
    { id: '25', name: 'Offshore Schools' },
    { id: '26', name: 'Service Childrens Education' },
    { id: '28', name: 'Academy Sponsor Led' },
    { id: '29', name: 'Higher education institution' },
    { id: '30', name: 'Welsh Establishment' },
    { id: '32', name: 'Special Post 16 Institution' },
    { id: '33', name: 'Academy Special Sponsor Led' },
    { id: '34', name: 'Academy Converter' },
    { id: '35', name: 'Free Schools' },
    { id: '36', name: 'Free Schools Special' },
    { id: '38', name: 'Free Schools - Alternative Provision' },
    { id: '39', name: 'Free Schools - 16-19' },
    { id: '40', name: 'University Technical College' },
    { id: '41', name: 'Studio Schools' },
    { id: '42', name: 'Academy Alternative Provision Converter' },
    { id: '43', name: 'Academy Alternative Provision Sponsor Led' },
    { id: '44', name: 'Academy Special Converter' },
    { id: '45', name: 'Academy 16-19 Converter' },
    { id: '46', name: 'Academy 16-19 Sponsor Led' },
  ];

  const establishmentType = establishmentTypes.find(x => x.id === typeId);
  if (establishmentType) {
    return establishmentType.name;
  }
  return typeId;
};

const getFriendlyFieldName = (fieldName) => {
  const conversions = [
    { source: 'id', friendly: 'user' },
    { source: 'organisation.category.id', friendly: 'category' },
    { source: 'organisation.id', friendly: 'organisation' },
    { source: 'organisation.localAuthority.id', friendly: 'local authority' },
    { source: 'organisation.phaseOfEducation.id', friendly: 'phase of education' },
    { source: 'organisation.region.id', friendly: 'region' },
    { source: 'organisation.status.id', friendly: 'status' },
    { source: 'organisation.type.id', friendly: 'type' },
    { source: 'role.id', friendly: 'role' },
  ];

  const conversion = conversions.find(x => x.source === fieldName);
  if (conversion) {
    return conversion.friendly;
  }
  return fieldName;
};

const getFriendlyValues = async (fieldName, values, correlationId) => {
  const conversions = [
    { source: 'id', valueConverter: getFriendlyUser },
    { source: 'organisation.category.id', valueConverter: getFriendlyOrganisationCategory },
    { source: 'organisation.id', valueConverter: getFriendlyOrganisation },
    { source: 'organisation.phaseOfEducation.id', valueConverter: getFriendlyOrganisationPhaseOfEducation },
    { source: 'organisation.region.id', valueConverter: getFriendlyOrganisationRegion },
    { source: 'organisation.status.id', valueConverter: getFriendlyOrganisationStatus },
    { source: 'organisation.type.id', valueConverter: getFriendlyOrganisationType },
  ];

  const conversion = conversions.find(x => x.source === fieldName);
  if (conversion) {
    const convertedValues = await mapAsync(values, (value) => {
      return conversion.valueConverter(value, correlationId);
    });
    return convertedValues;
  }
  return values;
};

const delay = async (milliseconds) => {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};

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

module.exports = {
  getUserDetails,
  getFriendlyFieldName,
  getFriendlyValues,
  waitForIndexToUpdate,
};
