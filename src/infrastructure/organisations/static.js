const getOrganisationById = async (id) => {
  return (await getPageOfOrganisations(1)).organisations.find(
    (x) => x.id === id,
  );
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
  searchOrgsAssociatedWithService,
};
