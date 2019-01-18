'use strict';

const express = require('express');
const logger = require('../../infrastructure/logger');
const { asyncWrapper } = require('login.dfe.express-error-handling');

const { getDashboard } = require('./getDashboard');
const { getServiceConfig } = require('./serviceConfig');
const router = express.Router({ mergeParams: true });

const services = (csrf) => {
  logger.info('Mounting services routes');

  //TODO: route / - multiple service selection

  router.get('/:sid', csrf, asyncWrapper(getDashboard));

  router.get('/:sid/service-configuration', csrf, asyncWrapper(getServiceConfig));

  return router;
};

module.exports = services;
