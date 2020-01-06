const getAllUserOrganisations = async (userId) => {
  return Promise.resolve([
    {
      "id": "83f00ace-f1a0-4338-8784-fa14f5943e5a",
      "name": "Some service",
      "description": "Some service that does some stuff",
      "status": 1,
      "userId": "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
      "requestDate": "2018-01-18T10:46:59.385Z",
      "approvers": [],
      "organisation": {
        "id": "88a1ed39-5a98-43da-b66e-78e564ea72b0",
        "name": "Big School"
      },
      "role": {
        "id": 0,
        "name": "End user"
      }
    }
  ]);
};

const getInvitationOrganisations = async (invitationId, correlationId) => {
  return Promise.resolve([
    {
      "invitationId": invitationId,
      "role": {
        "id": 0,
        "name": "End user"
      },
      "service": {
        "id": "3bfde961-f061-4786-b618-618deaf96e44",
        "name": "Key to success (KtS)"
      },
      "organisation": {
        "id": "88a1ed39-5a98-43da-b66e-78e564ea72b0",
        "name": "Big School"
      }
    }
  ])
};

const getPageOfOrganisations = async (pageNumber) => {
  return Promise.resolve({
    organisations: [
      {
        "id": "83f00ace-f1a0-4338-8784-fa14f5943e5a",
        "name": "Some service",
      }
    ],
    page: pageNumber,
    totalNumberOfPages: 1,
  });
};


const searchOrganisations = async (criteria, pageNumber, correlationId) => {
  return getPageOfOrganisations(pageNumber, correlationId);
};

const getOrganisationByIdV2 = async (id) => {
  return (await getPageOfOrganisations(1)).organisations.find(x => x.id === id);
};

const getOrganisationForUserV2 = async (userId, correlationId) => {
  return Promise.resolve([]);
};

const putInvitationInOrganisation = async (invitationId, organisationId, role, correlationId) => {
  return Promise.resolve();
};

const putUserInOrganisation = async (userId, organisationId, role, correlationId) => {
  return Promise.resolve();
};

const getPendingRequestsAssociatedWithUser = async (userId, correlationId) => {
  return Promise.resolve();
};

const updateRequestById = async (requestId, status, actionedBy, actionedReason, actionedAt, correlationId) => {
  return Promise.resolve();
};

module.exports = {
  getAllUserOrganisations,
  getInvitationOrganisations,
  searchOrganisations,
  getOrganisationByIdV2,
  getOrganisationForUserV2,
  putInvitationInOrganisation,
  putUserInOrganisation,
  getPendingRequestsAssociatedWithUser,
  updateRequestById,
};
