const localStorage = require('node-persist');
const logger = require('../logger/index');

const saveRedirectUrlsToStorage = async (redirectUrlsKey, redirectUrlsObject, serviceId) => {
  try {
    const saveStatus = await localStorage.setItem(redirectUrlsKey, redirectUrlsObject);
    if (saveStatus) {
      logger.info(`${redirectUrlsKey} data passed to local storage successfully for service ID:${serviceId}`);
    }
  } catch (error) {
    logger.error(`Error while passing ${redirectUrlsKey} data to local storage for service ID ${serviceId}:`, error);
  }
};

const retreiveRedirectUrlsFromStorage = async (redirectUrlsKey, serviceId) => {
  try {
    const result = await localStorage.getItem(redirectUrlsKey);
    if (result) {
      logger.info(`${redirectUrlsKey} data retrieved successfully from local storage for service ID: ${serviceId}`);
    } else {
      logger.info(`No available ${redirectUrlsKey} data to be retreived from the loacal storage for service ID: ${serviceId}`);
    }
    return result;
  } catch (error) {
    logger.error(`Error while retrieving ${redirectUrlsKey} data from local storage for service ID:${serviceId}:`, error);
    throw error;
  }
};

const deleteRedirectUrlsFromStorage = async (redirectUrlsKey, serviceId) => {
  try {
    const result = await localStorage.del(redirectUrlsKey);
    if (result) {
      logger.info(`${redirectUrlsKey} data removed successfully from local storage for service ID ${serviceId}`);
    } else {
      logger.info(`No ${redirectUrlsKey} data available to be removed from local storage for service ID ${serviceId}`);
    }

    return result;
  } catch (error) {
    logger.error(`Error while removing ${redirectUrlsKey} data from local storage for service ${serviceId}:`, error);
    throw error;
  }
};

module.exports = {
  saveRedirectUrlsToStorage,
  retreiveRedirectUrlsFromStorage,
  deleteRedirectUrlsFromStorage,
};
