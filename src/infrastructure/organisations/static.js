const getOrganisationById = async (id) => {
  return (await getPageOfOrganisations(1)).organisations.find(
    (x) => x.id === id,
  );
};

const getInvitationOrganisations = async (invitationId) => {
  return Promise.resolve([
    {
      invitationId: invitationId,
      role: {
        id: 0,
        name: "End user",
      },
      service: {
        id: "3bfde961-f061-4786-b618-618deaf96e44",
        name: "Key to success (KtS)",
      },
      organisation: {
        id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
        name: "Big School",
      },
    },
  ]);
};

const getPageOfOrganisations = async (pageNumber) => {
  return Promise.resolve({
    organisations: [
      {
        id: "83f00ace-f1a0-4338-8784-fa14f5943e5a",
        name: "Some service",
      },
    ],
    page: pageNumber,
    totalNumberOfPages: 1,
  });
};

const searchOrganisations = async (criteria, pageNumber, correlationId) => {
  return getPageOfOrganisations(pageNumber, correlationId);
};

const searchOrgsAssociatedWithService = async (
  serviceId,
  criteria,
  pageNumber,
  sortBy,
  sortDirection,
  correlationId,
) => {
  return getPageOfOrganisations(pageNumber, correlationId);
};

module.exports = {
  getOrganisationById,
  getInvitationOrganisations,
  searchOrganisations,
  searchOrgsAssociatedWithService,
};
