const express = require("express");
const bodyParser = require("body-parser");
const expressLayouts = require("express-ejs-layouts");
const http = require("http");
const https = require("https");
const path = require("path");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const sanitization = require("login.dfe.sanitization");
const { doubleCsrf } = require("csrf-csrf");
const flash = require("login.dfe.express-flash-2");
const session = require("express-session");
const {
  getErrorHandler,
  ejsErrorPages,
} = require("login.dfe.express-error-handling");
const Redis = require("ioredis");
const RedisStore = require("connect-redis").default;
const { setUserContext, isManageUser } = require("./infrastructure/utils");
const oidc = require("./infrastructure/oidc");
const configSchema = require("./infrastructure/config/schema");
const config = require("./infrastructure/config");
const logger = require("./infrastructure/logger");

const redisClient = new Redis(config.serviceMapping.params.connectionString);

// Initialize store.
const redisStore = new RedisStore({
  client: redisClient,
  prefix: "CookieSession:",
});

const registerRoutes = require("./routes");

configSchema.validate();

https.globalAgent.maxSockets = http.globalAgent.maxSockets =
  config.hostingEnvironment.agentKeepAlive.maxSockets || 50;

const init = async () => {
  const app = express();

  logger.info("set helmet policy defaults");
  const self = "'self'";
  const allowedOrigin = "*.signin.education.gov.uk";

  if (config.hostingEnvironment.hstsMaxAge) {
    app.use(
      helmet({
        strictTransportSecurity: {
          maxAge: config.hostingEnvironment.hstsMaxAge,
          preload: true,
          includeSubDomains: true,
        },
      }),
    );
  }
  // Setting helmet Content Security Policy
  const scriptSources = [
    self,
    "'unsafe-inline'",
    "'unsafe-eval'",
    allowedOrigin,
  ];
  const styleSources = [self, "'unsafe-inline'", allowedOrigin];
  const imgSources = [self, "data:", "blob:", allowedOrigin];
  const fontSources = [self, "data:", allowedOrigin];
  const defaultSources = [self, allowedOrigin];

  if (config.hostingEnvironment.env === "dev") {
    scriptSources.push("localhost:*");
    styleSources.push("localhost:*");
    imgSources.push("localhost:*");
    defaultSources.push("localhost:*");
  }

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: defaultSources,
          scriptSrc: scriptSources,
          styleSrc: styleSources,
          imgSrc: imgSources,
          fontSrc: fontSources,
          connectSrc: [self],
          formAction: [self, "*"],
        },
      },
      crossOriginOpenerPolicy: { policy: "unsafe-none" }, // crossOriginOpenerPolicy: false is ignored and unsafe-none is the default on MDM
    }),
  );

  logger.info("Set helmet filters");

  app.use(helmet.xssFilter());
  app.use(helmet.frameguard("false"));
  app.use(helmet.ieNoOpen());

  logger.info("helmet setup complete");

  let assetsUrl = config.assets.url;
  assetsUrl = assetsUrl.endsWith("/")
    ? assetsUrl.substr(0, assetsUrl.length - 1)
    : assetsUrl;
  Object.assign(app.locals, {
    urls: {
      accessibilityStatementUrl:
        config.hostingEnvironment.accessibilityStatementUrl,
      profile: config.hostingEnvironment.profileUrl,
      services: config.hostingEnvironment.servicesUrl,
      interactions: config.hostingEnvironment.interactionsUrl,
      help: config.hostingEnvironment.helpUrl,
      assets: assetsUrl,
      survey: config.hostingEnvironment.surveyUrl,
      serviceNow: config.hostingEnvironment.serviceNowUrl,
    },
    app: {
      title: "DfE Sign-in Manage",
      environmentBannerMessage:
        config.hostingEnvironment.environmentBannerMessage,
    },
    gaTrackingId: config.hostingEnvironment.gaTrackingId,
    assets: {
      version: config.assets.version,
    },
  });

  if (config.hostingEnvironment.env !== "dev") {
    app.set("trust proxy", 1);
  }

  let expiryInMinutes = 30;
  const sessionExpiry = parseInt(
    config.hostingEnvironment.sessionCookieExpiryInMinutes,
  );
  if (!isNaN(sessionExpiry)) {
    expiryInMinutes = sessionExpiry;
  }
  app.use(
    session({
      name: "session",
      store: redisStore,
      keys: [config.hostingEnvironment.sessionSecret],
      maxAge: expiryInMinutes * 60000, // Expiry in milliseconds
      httpOnly: true,
      secure: true,
      resave: true,
      saveUninitialized: true,
      secret: config.hostingEnvironment.sessionSecret,
      cookie: {
        httpOnly: true,
        secure: true,
        maxAge: expiryInMinutes * 60000, // Expiry in milliseconds
      },
    }),
  );

  app.use((req, res, next) => {
    req.session.now = Date.now();
    next();
  });

  app.use(cookieParser(config.hostingEnvironment.sessionSecret));

  const { doubleCsrfProtection: csrf } = doubleCsrf({
    getSecret: (req) => req.secret,
    getTokenFromRequest: (req) => req.body._csrf,
    secret: config.hostingEnvironment.csrfSecret,
    cookieName: "__host-csrf",
    cookieOptions: {
      sameSite: "strict",
      secure: true,
      signed: true,
    },
    path: "/",
    size: 64,
    ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  });

  app.use(flash());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(
    sanitization({
      sanitizer: (key, value) => {
        // add exception for fields that we don't want to encode
        const fieldToNotSanitize = ["criteria", "bannerMessage"];
        if (
          fieldToNotSanitize.find((x) => x.toLowerCase() === key.toLowerCase())
        ) {
          return value;
        }
        return sanitization.defaultSanitizer(key, value);
      },
    }),
  );
  app.set("view engine", "ejs");
  app.set("views", path.resolve(__dirname, "app"));
  app.use(expressLayouts);
  app.set("layout", "layouts/layout");

  await oidc.init(app);
  app.use(setUserContext);
  app.use("/assets", express.static(path.join(__dirname, "app/assets")));
  registerRoutes(app, csrf);
  app.use(isManageUser);

  // Error handing
  const errorPageRenderer = ejsErrorPages.getErrorPageRenderer(
    {
      help: config.hostingEnvironment.helpUrl,
      assets: assetsUrl,
      assetsVersion: config.assets.version,
    },
    config.hostingEnvironment.env === "dev",
  );
  app.use(
    getErrorHandler({
      logger,
      errorPageRenderer,
    }),
  );

  if (config.hostingEnvironment.env === "dev") {
    app.proxy = true;

    const options = {
      key: config.hostingEnvironment.sslKey,
      cert: config.hostingEnvironment.sslCert,
      requestCert: false,
      rejectUnauthorized: false,
    };
    const server = https.createServer(options, app);

    server.listen(config.hostingEnvironment.port, () => {
      logger.info(
        `Dev server listening on https://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`,
      );
    });
  } else {
    app.listen(process.env.PORT, () => {
      logger.info(
        `Server listening on http://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`,
      );
    });
  }
};

const app = init().catch((err) => {
  logger.error(err);
});

module.exports = app;
