const { getServiceBannersRaw } = require("login.dfe.api-client/services");

const listAllBannersForService = async (id) => {
  const allBanners = [];

  let pageNumber = 1;
  let isMorePages = true;
  while (isMorePages) {
    const page = await getServiceBannersRaw({
      serviceId: id,
      pageSize: 25,
      page: pageNumber,
    });
    page.banners.forEach((banner) => {
      allBanners.push(banner);
    });
    pageNumber += 1;
    isMorePages = pageNumber <= page.totalNumberOfPages;
  }
  return allBanners;
};

module.exports = {
  listAllBannersForService,
};
