'use strict';

const niceware = require('niceware');
const { getServiceById, updateService } = require('../../infrastructure/applications');
const logger = require('../../infrastructure/logger');
const { getUserServiceRoles } = require('./utils');

const getServiceSecrets = async (req, res) => {
  const service = await getServiceById(req.params.sid, req.id);
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render('services/views/serviceSecrets', {
    csrfToken: req.csrfToken(),
    service: {
      name: service.name,
      clientSecret: service.relyingParty.client_secret || '',
      apiSecret: service.relyingParty.api_secret || '',
    },
    backLink: `/services/${req.params.sid}`,
    validationMessages: {},
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentNavigation: 'configuration',
  });
};

const validate = async (req) => {
  const service = await getServiceById(req.params.sid, req.id);
  const manageRolesForService = await getUserServiceRoles(req);

  const model = {
    service: {
      name: service.name,
      clientSecret: req.body.clientSecret || '',
      apiSecret: req.body.apiSecret,
    },
    backLink: `/services/${req.params.sid}`,
    validationMessages: {},
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentNavigation: 'configuration',
  };

  if (model.service.clientSecret !== service.relyingParty.client_secret) {
    try {
      const validateClientSecret = niceware.passphraseToBytes(model.service.clientSecret.split('-'));
      if (validateClientSecret.length !== 8) {
        model.validationMessages.clientSecret = 'Invalid client secret';
      }
    } catch (e) {
      model.validationMessages.clientSecret = 'Invalid client secret';
    }
  }

  if (model.service.apiSecret !== service.relyingParty.api_secret) {
    try {
      const validateApiSecret = niceware.passphraseToBytes(model.service.apiSecret.split('-'));
      if (validateApiSecret.length !== 8) {
        model.validationMessages.apiSecret = 'Invalid API secret';
      }
    } catch (e) {
      model.validationMessages.apiSecret = 'Invalid API secret';
    }
  }
  return model;
};

const postServiceSecrets = async (req, res) => {
  const model = await validate(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render('services/views/serviceSecrets', model);
  }

  const updatedService = {
    clientSecret: model.service.clientSecret,
    grant_types: model.service.grantTypes,
    response_types: model.service.responseTypes,
    apiSecret: model.service.apiSecret,
    tokenEndpointAuthMethod: model.service.tokenEndpointAuthMethod === 'client_secret_post' ? 'client_secret_post' : null,
  };

  logger.audit(`${req.user.email} (id: ${req.user.sub}) updated service secret details for service ${model.service.name} (id: ${req.params.sid})`, {
    type: 'manage',
    subType: 'service-secret-details-updated',
    userId: req.user.sub,
    userEmail: req.user.email,
    editedService: req.params.sid,
  });

  await updateService(req.params.sid, updatedService, req.id);

  res.flash('title', 'Success');
  res.flash('heading', 'Service secret details have been updated');
  res.flash('message', 'Your service secret details update has been successfully saved.');

  return res.redirect(`${model.backLink}`);
};

module.exports = {
  getServiceSecrets,
  postServiceSecrets,
};
