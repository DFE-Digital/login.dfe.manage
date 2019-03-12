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
  'identifiers.service' : patterns.uuid,
  'identifiers.organisation': patterns.uuid,
});

accessIdentifiers.extend(schemas.apiClient);

const notificationsSchema = new SimpleSchema({
  connectionString: patterns.redis
});


const schema = new SimpleSchema({
  loggerSettings: schemas.loggerSettings,
  hostingEnvironment: schemas.hostingEnvironment,
  applications: schemas.apiClient,
  search: schemas.apiClient,
  access: accessIdentifiers,
  organisations: schemas.apiClient,
  directories: schemas.apiClient,
  identifyingParty: identifyingPartySchema,
  notifications: notificationsSchema,
});


module.exports.validate = () => {
  validateConfigAgainstSchema(config, schema, logger);
};
