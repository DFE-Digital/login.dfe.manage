const appCache = require('./AppCache');
const logger = require('../logger/index');

const saveRedirectUrls = (redirectUrlsKey, redirectUrlsObject, serviceId) => {
  try {
    const saveStatus = appCache.save(redirectUrlsKey, redirectUrlsObject);
    if (saveStatus) {
      logger.info(`${redirectUrlsKey} data saved to cache successfully for service ID:${serviceId}`);
    }
  } catch (error) {
    logger.error(`Error while saving ${redirectUrlsKey} data to cache for service ID ${serviceId}:`, error);
  }
};

const retreiveRedirectUrls = (redirectUrlsKey, serviceId) => {
  try {
    const result = appCache.retrieve(redirectUrlsKey);
    if (result) {
      logger.info(`${redirectUrlsKey} data retrieved successfully from cache for service ID: ${serviceId}`);
    } else {
      logger.info(`No available ${redirectUrlsKey} data to retreive from the cache for service ID: ${serviceId}`);
    }
    return result;
  } catch (error) {
    logger.error(`Error while retrieving ${redirectUrlsKey} data from cache for service ID:${serviceId}:`, error);
    throw error;
  }
};

const deleteRedirectUrlsFromCache = (redirectUrlsKey, serviceId) => {
  try {
    const result = appCache.delete(redirectUrlsKey);
    if (result) {
      logger.info(`${redirectUrlsKey} data deleted successfully from cache for service ID ${serviceId}`);
    } else {
      logger.info(`No ${redirectUrlsKey} data available to be deleted from cache for service ID ${serviceId}`);
    }

    return result;
  } catch (error) {
    logger.error(`Error while deleting ${redirectUrlsKey} data from cache for service ${serviceId}:`, error);
    throw error;
  }
};

module.exports = {
  saveRedirectUrls,
  retreiveRedirectUrls,
  deleteRedirectUrlsFromCache,
};
