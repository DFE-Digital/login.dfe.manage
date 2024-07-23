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

const deleteFromLocalStorage = async (keyWord) => {
  try {
    const storageKeys = await localStorage.keys();
    const keysToDelete = storageKeys.filter((key) => key.includes(keyWord));

    const deletePromises = keysToDelete.map(async (key) => {
      const result = await localStorage.del(key);
      if (result) {
        return `${key} data removed successfully from local storage`;
      }
      return `No data with key ${key} available to be removed from local storage`;
    });

    const results = await Promise.all(deletePromises);

    results.forEach((message) => {
      logger.info(message);
    });

    return true;
  } catch (error) {
    logger.error(`Error while removing ${keyWord} data from local storage:`, error);
    throw error;
  }
};

module.exports = {
  saveRedirectUrlsToStorage,
  retreiveRedirectUrlsFromStorage,
  deleteFromLocalStorage,
};
