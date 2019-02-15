'use strict';

const express = require('express');
const logger = require('../../infrastructure/logger');
const { asyncWrapper } = require('login.dfe.express-error-handling');
const { isLoggedIn, isManageUserForService, hasRole } = require('../../infrastructure/utils');
const uniqBy = require('lodash/uniqBy');

const { getDashboard } = require('./getDashboard');
const { getServiceConfig, postServiceConfig } = require('./serviceConfig');
const { get: getSelectService, post: postSelectService } = require('./selectService');
const { get: getServiceBanners, post: postServiceBanners } = require('./serviceBanners');
const { get: getNewServiceBanners, post: postNewServiceBanners } = require('./newServiceBanner');
const { get: getDeleteBanner, post: postDeleteBanner } = require('./deleteServiceBanner');

const router = express.Router({ mergeParams: true });

const services = (csrf) => {
  logger.info('Mounting services routes');
  router.use(isLoggedIn);

  router.get('/', asyncWrapper((req, res) => {
    if (!req.userServices || req.userServices.roles.length === 0) {
      return res.status(401).render('errors/views/notAuthorised');
    }
    return res.redirect(`services/select-service`);
  }));

  router.get('/select-service', csrf, asyncWrapper(getSelectService));
  router.post('/select-service', csrf, asyncWrapper(postSelectService));

  router.get('/:sid', csrf, isManageUserForService, asyncWrapper(getDashboard));

  router.get('/:sid/service-configuration', csrf, isManageUserForService, hasRole('serviceconfig'), asyncWrapper(getServiceConfig));
  router.post('/:sid/service-configuration', csrf, isManageUserForService, hasRole('serviceconfig'), asyncWrapper(postServiceConfig));

  router.get('/:sid/service-banners', csrf, isManageUserForService, hasRole('serviceBanner'), asyncWrapper(getServiceBanners));
  router.post('/:sid/service-banners', csrf, isManageUserForService, hasRole('serviceBanner'), asyncWrapper(postServiceBanners));

  router.get('/:sid/service-banners/new-banner', csrf, isManageUserForService, hasRole('serviceBanner'), asyncWrapper(getNewServiceBanners));
  router.post('/:sid/service-banners/new-banner', csrf, isManageUserForService, hasRole('serviceBanner'), asyncWrapper(postNewServiceBanners));

  router.get('/:sid/service-banners/:bid', csrf, isManageUserForService, hasRole('serviceBanner'), asyncWrapper(getNewServiceBanners));
  router.post('/:sid/service-banners/:bid', csrf, isManageUserForService, hasRole('serviceBanner'), asyncWrapper(postNewServiceBanners));

  router.get('/:sid/service-banners/:bid/delete-banner', csrf, isManageUserForService, hasRole('serviceBanner'), asyncWrapper(getDeleteBanner));
  router.post('/:sid/service-banners/:bid/delete-banner', csrf, isManageUserForService, hasRole('serviceBanner'), asyncWrapper(postDeleteBanner));

  return router;
};

module.exports = services;
