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
const { get: getUsersSearch, post: postUsersSearch } = require('./usersSearch');
const getUserOrganisations = require('./getUserOrganisations');
const { get: getWebServiceSync, post: postWebServiceSync } = require('./webServiceSync');
const { get: getOrganisationsSearch, post: postOrganisationsSearch } = require('./organisationsSearch');
const { get: getOrganisationUserList, post: postOrganisationUserList } = require('./organisationUserList');
const { get: getWebServiceSyncOrg, post: postWebServiceSyncOrg } = require('./webServiceSyncOrg');
const { get: getEditService, post: postEditService } = require('./editService');
const { get: getConfirmEditService, post: postConfirmEditService } = require('./confirmEditService');
const { get: getRemoveService, post: postRemoveService } = require('./removeService');
const { get: getListPolicies, post: postListPolicies } = require('./listPolicies');
const getPolicyConditions = require('./getPolicyConditions');
const getPolicyRoles = require('./getPolicyRoles');
const { get: getNewUserDetails , post: postNewUserDetails } = require('./newUserDetails');
const { get: getSelectOrganisation, post: postSelectOrganisation } = require('./selectOrganisation');

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

  // service config
  router.get('/:sid/service-configuration', csrf, isManageUserForService, hasRole('serviceconfig'), asyncWrapper(getServiceConfig));
  router.post('/:sid/service-configuration', csrf, isManageUserForService, hasRole('serviceconfig'), asyncWrapper(postServiceConfig));

  // service banners
  router.get('/:sid/service-banners', csrf, isManageUserForService, hasRole('serviceBanner'), asyncWrapper(getServiceBanners));
  router.post('/:sid/service-banners', csrf, isManageUserForService, hasRole('serviceBanner'), asyncWrapper(postServiceBanners));

  router.get('/:sid/service-banners/new-banner', csrf, isManageUserForService, hasRole('serviceBanner'), asyncWrapper(getNewServiceBanners));
  router.post('/:sid/service-banners/new-banner', csrf, isManageUserForService, hasRole('serviceBanner'), asyncWrapper(postNewServiceBanners));

  router.get('/:sid/service-banners/:bid', csrf, isManageUserForService, hasRole('serviceBanner'), asyncWrapper(getNewServiceBanners));
  router.post('/:sid/service-banners/:bid', csrf, isManageUserForService, hasRole('serviceBanner'), asyncWrapper(postNewServiceBanners));

  router.get('/:sid/service-banners/:bid/delete-banner', csrf, isManageUserForService, hasRole('serviceBanner'), asyncWrapper(getDeleteBanner));
  router.post('/:sid/service-banners/:bid/delete-banner', csrf, isManageUserForService, hasRole('serviceBanner'), asyncWrapper(postDeleteBanner));

  // service support
  router.get('/:sid/users', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper(getUsersSearch));
  router.post('/:sid/users', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper(postUsersSearch));

  router.get('/:sid/users/new-user', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper(getNewUserDetails));
  router.post('/:sid/users/new-user', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper(postNewUserDetails));

  router.get('/:sid/users/:uid/select-organisation', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper(getSelectOrganisation));
  router.post('/:sid/users/:uid/select-organisation', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper(postSelectOrganisation));

  router.get('/:sid/users/:uid/associate-organisation', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper());
  router.post('/:sid/users/:uid/associate-organisation', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper());

  router.get('/:sid/users/associate-organisation', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper());
  router.post('/:sid/users/associate-organisation', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper());

  router.get('/:sid/users/:uid/organisations', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper(getUserOrganisations));

  router.get('/:sid/users/:uid/organisations/:oid', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper(getEditService));
  router.post('/:sid/users/:uid/organisations/:oid', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper(postEditService));

  router.get('/:sid/users/:uid/organisations/:oid/confirm-edit-service', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper(getConfirmEditService));
  router.post('/:sid/users/:uid/organisations/:oid/confirm-edit-service', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper(postConfirmEditService));

  router.get('/:sid/users/:uid/organisations/:oid/remove-service', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper(getRemoveService));
  router.post('/:sid/users/:uid/organisations/:oid/remove-service', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper(postRemoveService));

  router.get('/:sid/users/:uid/web-service-sync',csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper(getWebServiceSync));
  router.post('/:sid/users/:uid/web-service-sync',csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper(postWebServiceSync));

  router.get('/:sid/organisations', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper(getOrganisationsSearch));
  router.post('/:sid/organisations', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper(postOrganisationsSearch));

  router.get('/:sid/organisations/:oid/users', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper(getOrganisationUserList));
  router.post('/:sid/organisations/:oid/users', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper(postOrganisationUserList));

  router.get('/:sid/organisations/:oid/web-service-sync', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper(getWebServiceSyncOrg));
  router.post('/:sid/organisations/:oid/web-service-sync', csrf, isManageUserForService, hasRole('serviceSup'), asyncWrapper(postWebServiceSyncOrg));

  // service access management
  router.get('/:sid/policies', csrf, isManageUserForService, hasRole('accessManage'), asyncWrapper(getListPolicies));
  router.post('/:sid/policies', csrf, isManageUserForService, hasRole('accessManage'), asyncWrapper(postListPolicies));

  router.get('/:sid/policies/:pid/conditions', csrf, isManageUserForService, hasRole('accessManage'), asyncWrapper(getPolicyConditions));

  router.get('/:sid/policies/:pid/roles', csrf, isManageUserForService, hasRole('accessManage'), asyncWrapper(getPolicyRoles));

  return router;
};

module.exports = services;
