'use strict';

const express = require('express');
const { asyncWrapper } = require('login.dfe.express-error-handling');
const logger = require('../../infrastructure/logger');
const { isLoggedIn, isManageUserForService, hasRole } = require('../../infrastructure/utils');

const { getServiceStartPage } = require('./service/getStartPage');

const router = express.Router({ mergeParams: true });

const onboarding = (csrf) => {
  logger.info('Mounting onboarding routes');
  router.use(isLoggedIn);

  router.get('/:sid/service', csrf, isManageUserForService, hasRole('onboardSvc'), asyncWrapper(getServiceStartPage));

  return router;
};

module.exports = onboarding;
