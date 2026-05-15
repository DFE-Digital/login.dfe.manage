const Module = require("module");
const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === "ioredis") {
    return require("ioredis-mock");
  }
  return originalLoad.apply(this, arguments);
};
