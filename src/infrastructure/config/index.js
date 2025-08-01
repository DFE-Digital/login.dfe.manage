const fs = require('fs');
const os = require('os');
const path = require('path');

require('dotenv').config();

const config = {
  loggerSettings: {
    logLevel: "debug",
    applicationName: "Manage",
    auditDb: {
      host: process.env.PLATFORM_GLOBAL_SERVER_NAME,
      username: process.env.SVC_SIGNIN_ADT,
      password: process.env.SVC_SIGNIN_ADT_PASSWORD,
      dialect: "mssql",
      name: process.env.PLATFORM_GLOBAL_AUDIT_DATABASE_NAME,
      encrypt: true,
      schema: "dbo",
      pool: {
        max: 20,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  },
  hostingEnvironment: {
    useDevViews: true,
    env: process.env.LOCAL_ENV || "azure",
    host: process.env.LOCAL_HOST || process.env.STANDALONE_MANAGE_HOST_NAME,
    port: process.env.LOCAL_PORT_MANAGE || 443,
    sslCert: process.env.LOCAL_SSL_CERT ? process.env.LOCAL_SSL_CERT.replace(/\\n/g, '\n') : "",
    sslKey: process.env.LOCAL_SSL_KEY ? process.env.LOCAL_SSL_KEY.replace(/\\n/g, '\n') : "",
    protocol: "https",
    hstsMaxAge: 86400,
    applicationInsights: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    sessionSecret: process.env.SESSION_ENCRYPTION_SECRET_MNG,
    sessionCookieExpiryInMinutes: 480,
    gaTrackingId: process.env.GOOGLE_ANALYTICS_ID,
    interactionsUrl: "https://" + process.env.STANDALONE_INTERACTIONS_HOST_NAME,
    helpUrl: "https://" + process.env.STANDALONE_HELP_HOST_NAME,
    servicesUrl: "https://" + process.env.STANDALONE_SERVICES_HOST_NAME,
    profileUrl: "https://" + process.env.STANDALONE_PROFILE_HOST_NAME,
    surveyUrl: process.env.PLATFORM_GLOBAL_USER_FEEDBACK_URL,
    serviceNowUrl: process.env.SN_CONTACT_URL,
    agentKeepAlive: {
      maxSockets: 30,
      maxFreeSockets: 10,
      timeout: 60000,
      keepAliveTimeout: 30000
    }
  },
  identifyingParty: {
    url: "https://" + process.env.STANDALONE_OIDC_HOST_NAME,
    clientId: process.env.IDENTIFYING_PARTY_ID,
    clientSecret: process.env.IDENTIFYING_PARTY_SECRET,
    clockTolerance: 300
  },
  access: {
    type: "api",
    service: {
      url: "https://" + process.env.STANDALONE_ACCESS_HOST_NAME,
      auth: {
        type: "aad",
        tenant: process.env.PLATFORM_GLOBAL_TENANT_DOMAIN,
        authorityHostUrl: process.env.TENANT_URL,
        clientId: process.env.AAD_SHD_CLIENT_ID,
        clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
        resource: process.env.AAD_SHD_APP_ID
      }
    },
    identifiers: {
      service: "b1f190aa-729a-45fc-a695-4ea209dc79d4",
      organisation: process.env.IDENTIFIER_ORG_ID
    }
  },
  applications: {
    type: "api",
    service: {
      url: "https://" + process.env.STANDALONE_APPLICATIONS_HOST_NAME,
      auth: {
        type: "aad",
        tenant: process.env.PLATFORM_GLOBAL_TENANT_DOMAIN,
        authorityHostUrl: process.env.TENANT_URL,
        clientId: process.env.AAD_SHD_CLIENT_ID,
        clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
        resource: process.env.AAD_SHD_APP_ID
      }
    }
  },
  directories: {
    type: "api",
    service: {
      url: "https://" + process.env.STANDALONE_DIRECTORIES_HOST_NAME,
      auth: {
        type: "aad",
        tenant: process.env.PLATFORM_GLOBAL_TENANT_DOMAIN,
        authorityHostUrl: process.env.TENANT_URL,
        clientId: process.env.AAD_SHD_CLIENT_ID,
        clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
        resource: process.env.AAD_SHD_APP_ID
      }
    }
  },
  organisations: {
    type: "api",
    service: {
      url: "https://" + process.env.STANDALONE_ORGANISATIONS_HOST_NAME,
      auth: {
        type: "aad",
        tenant: process.env.PLATFORM_GLOBAL_TENANT_DOMAIN,
        authorityHostUrl: process.env.TENANT_URL,
        clientId: process.env.AAD_SHD_CLIENT_ID,
        clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
        resource: process.env.AAD_SHD_APP_ID
      }
    }
  },
  audit: {
    type: "sequelize",
    params: {
      host: process.env.PLATFORM_GLOBAL_SERVER_NAME,
      username: process.env.SVC_SIGNIN_ADT,
      password: process.env.SVC_SIGNIN_ADT_PASSWORD,
      dialect: "mssql",
      name: process.env.PLATFORM_GLOBAL_AUDIT_DATABASE_NAME,
      encrypt: true,
      schema: "dbo",
      pool: {
        max: 15,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    },
    cacheConnectionString: process.env.LOCAL_REDIS_CONN ? process.env.LOCAL_REDIS_CONN + "/7" : process.env.REDIS_CONN + "/7?tls=true"
  },
  serviceMapping: {
    type: "redis",
    params: {
      connectionString: process.env.LOCAL_REDIS_CONN ? process.env.LOCAL_REDIS_CONN + "/3" : process.env.REDIS_CONN + "/3?tls=true"
    },
    key2SuccessServiceId: process.env.SUCC_SVC_ID
  },
  search: {
    type: "api",
    service: {
      url: "https://" + process.env.STANDALONE_SEARCH_HOST_NAME,
      auth: {
        type: "aad",
        tenant: process.env.PLATFORM_GLOBAL_TENANT_DOMAIN,
        authorityHostUrl: process.env.TENANT_URL,
        clientId: process.env.AAD_SHD_CLIENT_ID,
        clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
        resource: process.env.AAD_SHD_APP_ID
      }
    },
  },
  notifications: {
    connectionString: process.env.LOCAL_REDIS_CONN ? process.env.LOCAL_REDIS_CONN + "/4" : process.env.REDIS_CONN + "/4?tls=true"
  },
  assets: {
    url: process.env.CDN_HOST_NAME,
    version: process.env.CDN_ASSETS_VERSION
  }
}

// Persist configuration to a temporary file and then point the `settings` environment
// variable to the path of the temporary file. The `login.dfe.dao` package can then load
// this configuration.
function mimicLegacySettings(config) {
  // TODO: This can be improved by refactoring the `login.dfe.dao` package.
  const tempDirectoryPath = fs.mkdtempSync(path.join(os.tmpdir(), 'config-'));
  const tempConfigFilePath = path.join(tempDirectoryPath, 'config.json');

  fs.writeFileSync(tempConfigFilePath, JSON.stringify(config), { encoding: 'utf8' });
  process.env.settings = tempConfigFilePath;
}

mimicLegacySettings(config);

module.exports = config;
