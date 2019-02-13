const applications = [];

const getServiceById = async (idOrClientId, correlationId) => {
  return applications.find(a => a.id.toLowerCase() === idOrClientId.toLowerCase() || (a.relyingParty && a.relyingParty.clientId.toLowerCase() === idOrClientId.toLowerCase()));
};

const updateService = async (id, body, correlationId) => {
  return Promise.resolve(null);
};

const listAllServices = async (correlationId) => {
  return Promise.resolve(null);
};

const listBannersForService = async (id, pageSize, page, correlationId) => {
  return Promise.resolve({
    banners: {
      id: 'bannerId',
      serviceId: 'serviceId',
      name: 'banner name',
      title: 'banner title',
      message: 'banner message',
    },
    page: page,
    totalNumberOfPages: 1,
    totalNumberOfRecords: 1,
  });
};

const getBannerById = async (id, bid, correlationId) => {
  return Promise.resolve(null);
};

const upsertBanner = async (sid, banner, correlationId) => {
  return Promise.resolve(null);
};

const listAllBannersForService = async (id, correlationId) => {
  return (await listBannersForService(id, 25, 1, correlationId).banners.find(x => x.id === id))
};

module.exports = {
  getServiceById,
  updateService,
  listAllServices,
  listBannersForService,
  getBannerById,
  upsertBanner,
  listAllBannersForService,
};
