const updateService = async () => Promise.resolve(null);

const listAllServices = async () => Promise.resolve(null);

const listBannersForService = async (page) =>
  Promise.resolve({
    banners: {
      id: "bannerId",
      serviceId: "serviceId",
      name: "banner name",
      title: "banner title",
      message: "banner message",
    },
    page,
    totalNumberOfPages: 1,
    totalNumberOfRecords: 1,
  });

const getBannerById = async () => Promise.resolve(null);

const upsertBanner = async () => Promise.resolve(null);

const removeBanner = async () => Promise.resolve(null);

const listAllBannersForService = async (id, correlationId) =>
  listBannersForService(id, 25, 1, correlationId).banners.find(
    (x) => x.id === id,
  );

module.exports = {
  updateService,
  listAllServices,
  listBannersForService,
  getBannerById,
  upsertBanner,
  removeBanner,
  listAllBannersForService,
};
