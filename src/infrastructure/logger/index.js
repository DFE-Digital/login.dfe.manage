const { createLogger, format, transports, addColors } = require("winston");
const WinstonSequelizeTransport = require("login.dfe.audit.winston-sequelize-transport");
const appInsights = require("applicationinsights");
const AppInsightsTransport = require("login.dfe.winston-appinsights");
const config = require("./../config");

const logLevel =
  config && config.loggerSettings && config.loggerSettings.logLevel
    ? config.loggerSettings.logLevel
    : "info";

const levelsAndColor = {
  levels: {
    audit: 0,
    error: 1,
    warn: 2,
    info: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  },
  colors: {
    audit: "magenta",
    silly: "rainbow",
  },
  transports: [],
};

const hideAudit = format((info) =>
  info.level.toLowerCase() === "audit" ? false : info,
);
// Add the custom audit/silly colours, so they don't clash.
addColors(levelsAndColor.colors);

const loggerConfig = {
  levels: levelsAndColor.levels,
  transports: [],
};

loggerConfig.transports.push(
  new transports.Console({
    format: format.combine(hideAudit(), format.simple()),
    level: logLevel,
  }),
);

const sequelizeTransport = WinstonSequelizeTransport(config);
if (sequelizeTransport) {
  loggerConfig.transports.push(sequelizeTransport);
}

if (config.hostingEnvironment.applicationInsights) {
  appInsights
    .setup(config.hostingEnvironment.applicationInsights)
    .setAutoCollectConsole(false, false)
    .start();
  loggerConfig.transports.push(
    new AppInsightsTransport({
      format: format.combine(hideAudit(), format.json()),
      client: appInsights.defaultClient,
      applicationName: config.loggerSettings.applicationName || "Manage",
      type: "event",
      treatErrorsAsExceptions: true,
    }),
  );
}

const logger = createLogger(loggerConfig);

process.on("unhandledRejection", (reason, p) => {
  logger.error("Unhandled Rejection at:", p, "reason:", reason);
});

module.exports = logger;
