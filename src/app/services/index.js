'use strict';

const express = require('express');
const logger = require('../../infrastructure/logger');
const { asyncWrapper } = require('login.dfe.express-error-handling');
const { isLoggedIn } = require('../../infrastructure/utils');

const { getDashboard } = require('./getDashboard');
const { getServiceConfig, postServiceConfig } = require('./serviceConfig');

const router = express.Router({ mergeParams: true });

const services = (csrf) => {
  logger.info('Mounting services routes');
  router.use(isLoggedIn);

  //TODO: route / - multiple service selection

  router.get('/:sid', csrf, asyncWrapper(getDashboard));

  router.get('/:sid/service-configuration', csrf, asyncWrapper(getServiceConfig));
  router.post('/:sid/service-configuration', csrf, asyncWrapper(postServiceConfig));
  return router;
};

module.exports = services;
