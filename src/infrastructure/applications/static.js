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

const listBannersForService = async (id, pageSize, correlationId) => {
  return Promise.resolve(null);
};

const getBannerById = async (id, bid, correlationId) => {
  return Promise.resolve(null);
};

const upsertBanner = async (sid, banner, correlationId) => {
  return Promise.resolve(null);
};

module.exports = {
  getServiceById,
  updateService,
  listAllServices,
  listBannersForService,
  getBannerById,
  upsertBanner,
};
