const NodeCache = require('node-persist');
const config = require('../config');

const store = new NodeCache({ stdTTL: config.hostingEnvironment.AppCache2Expiry ? config.hostingEnvironment.AppCache2Expiry : 3600 });

// Call store
await store.init();

const addItem = async (key, value) => {
  await store.setItem(key, value);
};

module.exports = {
  addItem,
}
