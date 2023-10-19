const NodeCache = require('node-cache');
const config = require('../config');

const store = new NodeCache({ stdTTL: config.hostingEnvironment.appCacheExpiry ? config.hostingEnvironment.appCacheExpiry : 3600 });

class AppCache {
  static save(key, value) {
    try {
      const status = store.set(key, value);
      return status;
    } catch (e) {
      return false;
    }
  }

  static retrieve(key) {
    return store.get(key);
  }

  static delete(key) {
    return store.del(key);
  }

  static allKeys() {
    return store.keys();
  }

  static flushAll() {
    return store.flushAll();
  }

  static clear() {
    store.close();
    delete AppCache.instance;
  }
}

module.exports = AppCache;
