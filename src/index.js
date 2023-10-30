const express = require('express');
const bodyParser = require('body-parser');
const expressLayouts = require('express-ejs-layouts');
const http = require('http');
const https = require('https');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const sanitization = require('login.dfe.sanitization');
const csurf = require('csurf');
const flash = require('login.dfe.express-flash-2');
const session = require('cookie-session');
const { getErrorHandler, ejsErrorPages } = require('login.dfe.express-error-handling');
const moment = require('moment');
const localStorage = require('node-persist');
const { setUserContext, isManageUser } = require('./infrastructure/utils');
const oidc = require('./infrastructure/oidc');
const configSchema = require('./infrastructure/config/schema');
const config = require('./infrastructure/config');
const logger = require('./infrastructure/logger');

const registerRoutes = require('./routes');

configSchema.validate();

https.globalAgent.maxSockets = http.globalAgent.maxSockets = config.hostingEnvironment.agentKeepAlive.maxSockets || 50;

const init = async () => {
  localStorage.init({
    ttl: 60 * 60 * 1000,
  });

  const csrf = csurf({
    cookie: {
      secure: true,
      httpOnly: true,
    },
  });
  const app = express();

  if (config.hostingEnvironment.hstsMaxAge) {
    app.use(helmet({
      noCache: true,
      frameguard: {
        action: 'deny',
      },
      hsts: {
        maxAge: config.hostingEnvironment.hstsMaxAge,
        preload: true,
      },
    }));
  }
  logger.info('set helmet policy defaults');

  // Setting helmet Content Security Policy
  const scriptSources = ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'localhost', '*.signin.education.gov.uk'];

  app.use(helmet.contentSecurityPolicy({
    browserSniff: false,
    setAllHeaders: false,
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      childSrc: ["'none'"],
      objectSrc: ["'none'"],
      scriptSrc: scriptSources,
      styleSrc: ["'self'", "'unsafe-inline'", 'localhost', '*.signin.education.gov.uk'],
      imgSrc: ["'self'", 'data:', 'blob:', 'localhost', '*.signin.education.gov.uk'],
      fontSrc: ["'self'", 'data:', '*.signin.education.gov.uk'],
      connectSrc: ["'self'"],
      formAction: ["'self'", '*'],
    },
  }));

  logger.info('Set helmet filters');

  app.use(helmet.xssFilter());
  app.use(helmet.frameguard('false'));
  app.use(helmet.ieNoOpen());

  logger.info('helmet setup complete');

  let assetsUrl = config.assets.url;
  assetsUrl = assetsUrl.endsWith('/') ? assetsUrl.substr(0, assetsUrl.length - 1) : assetsUrl;
  Object.assign(app.locals, {
    moment,
    urls: {
      profile: config.hostingEnvironment.profileUrl,
      services: config.hostingEnvironment.servicesUrl,
      interactions: config.hostingEnvironment.interactionsUrl,
      help: config.hostingEnvironment.helpUrl,
      assets: assetsUrl,
      survey: config.hostingEnvironment.surveyUrl,
      serviceNow: config.hostingEnvironment.serviceNowUrl,
    },
    app: {
      title: 'DfE Sign-in Manage',
      environmentBannerMessage: config.hostingEnvironment.environmentBannerMessage,
    },
    gaTrackingId: config.hostingEnvironment.gaTrackingId,
    assets: {
      version: config.assets.version,
    },
  });

  if (config.hostingEnvironment.env !== 'dev') {
    app.set('trust proxy', 1);
  }

  let expiryInMinutes = 30;
  const sessionExpiry = parseInt(config.hostingEnvironment.sessionCookieExpiryInMinutes);
  if (!isNaN(sessionExpiry)) {
    expiryInMinutes = sessionExpiry;
  }
  app.use(session({
    keys: [config.hostingEnvironment.sessionSecret],
    maxAge: expiryInMinutes * 60000, // Expiry in milliseconds
    httpOnly: true,
    secure: true,
  }));
  app.use((req, res, next) => {
    req.session.now = Date.now();
    next();
  });

  app.use(flash());

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(sanitization({
    sanitizer: (key, value) => {
      // add exception for fields that we don't want to encode
      const fieldToNotSanitize = ['criteria'];
      if (fieldToNotSanitize.find((x) => x.toLowerCase() === key.toLowerCase())) {
        return value;
      }
      return sanitization.defaultSanitizer(key, value);
    },
  }));
  app.set('view engine', 'ejs');
  app.set('views', path.resolve(__dirname, 'app'));
  app.use(expressLayouts);
  app.set('layout', 'layouts/layout');

    /*
    Addressing issue with latest version of passport dependency packge
    TypeError: req.session.regenerate is not a function
    Reference: https://github.com/jaredhanson/passport/issues/907#issuecomment-1697590189
  */
    app.use((request, response, next) => {
      if (request.session && !request.session.regenerate) {
      request.session.regenerate = (cb) => {
        cb();
      };
    }
    if (request.session && !request.session.save) {
      request.session.save = (cb) => {
        cb();
      };
    }
    next();
  });

  await oidc.init(app);
  app.use(setUserContext);
  app.use('/assets', express.static(path.join(__dirname, 'app/assets')));
  registerRoutes(app, csrf);
  app.use(isManageUser);

  // Error handing
  const errorPageRenderer = ejsErrorPages.getErrorPageRenderer({
    help: config.hostingEnvironment.helpUrl,
    assets: assetsUrl,
    assetsVersion: config.assets.version,
  }, config.hostingEnvironment.env === 'dev');
  app.use(getErrorHandler({
    logger,
    errorPageRenderer,
  }));

  if (config.hostingEnvironment.env === 'dev') {
    app.proxy = true;

    const options = {
      key: config.hostingEnvironment.sslKey,
      cert: config.hostingEnvironment.sslCert,
      requestCert: false,
      rejectUnauthorized: false,
    };
    const server = https.createServer(options, app);

    server.listen(config.hostingEnvironment.port, () => {
      logger.info(`Dev server listening on https://${config.hostingEnvironment.host}:${config.hostingEnvironment.port} with config:\n${JSON.stringify(config)}`);
    });
  } else {
    app.listen(process.env.PORT, () => {
      logger.info(`Server listening on http://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`);
    });
  }
};

const app = init().catch(((err) => {
  logger.error(err);
}));

module.exports = app;
