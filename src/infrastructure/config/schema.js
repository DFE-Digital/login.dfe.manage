const SimpleSchema = require('simpl-schema').default;
const { validateConfigAgainstSchema, schemas, patterns } = require('login.dfe.config.schema.common');
const config = require('./index');
const logger = require('./../logger');

const identifyingPartySchema = new SimpleSchema({
  url: patterns.url,
  clientId: String,
  clientSecret: String,
  clockTolerance: SimpleSchema.Integer,
});

const accessIdentifiers = new SimpleSchema({
  identifiers: {
    type: Object,
  },
  'identifiers.service': patterns.uuid,
  'identifiers.organisation': patterns.uuid,
});

accessIdentifiers.extend(schemas.apiClient);

const notificationsSchema = new SimpleSchema({
  connectionString: patterns.redis
});

const auditSchema = new SimpleSchema({
  type: {
    type: String,
    allowedValues: ['static', 'sequelize']
  },
  params: {
    type: schemas.sequelizeConnection,
    optional: true,
    custom: function () {
      if (this.siblingField('type').value === 'sequelize' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
    },
  },
  cacheConnectionString: patterns.redis,
});

const serviceMappingSchema = new SimpleSchema({
  type: {
    type: String,
    allowedValues: ['redis'],
  },
  params: {
    type: Object,
    optional: true,
    custom: function () {
      if (this.siblingField('type').value === 'redis' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
    }
  },
  'params.connectionString': {
    type: String,
    regEx: patterns.redis,
    optional: true,
    custom: function () {
      if (this.field('type').value === 'redis' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
    },
  },
  key2SuccessServiceId: patterns.uuid,
});

const hostingEnvironmentSchema = new SimpleSchema({
  csrfSecret: {
    type: String,
    optional: true,
  },
});

const schema = new SimpleSchema({
  loggerSettings: schemas.loggerSettings,
  hostingEnvironment: schemas.hostingEnvironment.extend(hostingEnvironmentSchema),
  applications: schemas.apiClient,
  search: schemas.apiClient,
  access: accessIdentifiers,
  organisations: schemas.apiClient,
  directories: schemas.apiClient,
  identifyingParty: identifyingPartySchema,
  notifications: notificationsSchema,
  audit: auditSchema,
  serviceMapping: serviceMappingSchema,
  assets: schemas.assets,
});


module.exports.validate = () => {
  validateConfigAgainstSchema(config, schema, logger);
};
