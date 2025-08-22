const express = require("express");
const { asyncWrapper } = require("login.dfe.express-error-handling");
const logger = require("../../infrastructure/logger");
const {
  isLoggedIn,
  isManageUserForService,
  hasRole,
  hasGenericRole,
  hasInvite,
} = require("../../infrastructure/utils");

const { getDashboard } = require("./getDashboard");
const getServiceInfo = require("./getServiceInfo");
const getEditServiceInfo = require("./getEditServiceInfo");
const postEditServiceInfo = require("./postEditServiceInfo");
const getConfirmEditServiceInfo = require("./getConfirmEditServiceInfo");
const postConfirmEditServiceInfo = require("./postConfirmEditServiceInfo");
const { getServiceConfig, postServiceConfig } = require("./serviceConfig");
const {
  getConfirmServiceConfig,
  postConfirmServiceConfig,
} = require("./confirmServiceConfig");
const {
  get: getSelectService,
  post: postSelectService,
} = require("./selectService");
const {
  get: getServiceBanners,
  post: postServiceBanners,
} = require("./serviceBanners");
const {
  get: getNewServiceBanners,
  post: postNewServiceBanners,
} = require("./newServiceBanner");
const {
  get: getDeleteBanner,
  post: postDeleteBanner,
} = require("./deleteServiceBanner");
const { get: getUsersSearch, post: postUsersSearch } = require("./usersSearch");
const getUserOrganisations = require("./getUserOrganisations");
const {
  get: getWebServiceSync,
  post: postWebServiceSync,
} = require("./webServiceSync");
const {
  get: getOrganisationsSearch,
  post: postOrganisationsSearch,
} = require("./organisationsSearch");
const {
  get: getOrganisationUserList,
  post: postOrganisationUserList,
} = require("./organisationUserList");
const {
  get: getWebServiceSyncOrg,
  post: postWebServiceSyncOrg,
} = require("./webServiceSyncOrg");
const { get: getEditService, post: postEditService } = require("./editService");
const {
  get: getConfirmEditService,
  post: postConfirmEditService,
} = require("./confirmEditService");
const {
  get: getRemoveService,
  post: postRemoveService,
} = require("./removeService");
const {
  get: getAssociateService,
  post: postAssociateService,
} = require("./associateService");
const {
  get: getConfirmAssociateService,
  post: postConfirmAssociateService,
} = require("./confirmAssociateService");
const {
  get: getListPolicies,
  post: postListPolicies,
} = require("./listPolicies");
const getPolicyConditions = require("./getPolicyConditionsAndRoles");
const getCreatePolicyCondition = require("./getCreatePolicyCondition");
const postCreatePolicyCondition = require("./postCreatePolicyCondition");
const getConfirmCreatePolicyCondition = require("./getConfirmCreatePolicyCondition");
const postConfirmCreatePolicyCondition = require("./postConfirmCreatePolicyCondition");
const getConfirmRemovePolicyCondition = require("./getConfirmRemovePolicyCondition");
const postConfirmRemovePolicyCondition = require("./postConfirmRemovePolicyCondition");

const {
  get: getAssociateRoles,
  post: postAssociateRoles,
} = require("./associateRoles");
const {
  get: getConfirmInvitation,
  post: postConfirmInvitation,
} = require("./confirmInvitation");
const getAudit = require("./getAudit");
const postUpdateAuditLog = require("./postUpdateAuditLog");

const router = express.Router({ mergeParams: true });

const services = (csrf) => {
  logger.info("Mounting services routes");
  router.use(isLoggedIn);

  router.get(
    "/",
    asyncWrapper((req, res) => {
      if (!req.userServices || req.userServices.roles.length === 0) {
        return res.status(401).render("errors/views/notAuthorised");
      }
      return res.redirect("services/select-service");
    }),
  );

  router.get("/select-service", csrf, asyncWrapper(getSelectService));
  router.post("/select-service", csrf, asyncWrapper(postSelectService));

  router.get("/:sid", csrf, isManageUserForService, asyncWrapper(getDashboard));

  // service information
  router.get(
    "/:sid/service-information",
    csrf,
    isManageUserForService,
    asyncWrapper(getServiceInfo),
  );

  router.get(
    "/:sid/service-information/edit",
    csrf,
    isManageUserForService,
    hasGenericRole("manageModifyPolicyCondition"),
    asyncWrapper(getEditServiceInfo),
  );
  router.post(
    "/:sid/service-information/edit",
    csrf,
    isManageUserForService,
    hasGenericRole("manageModifyPolicyCondition"),
    asyncWrapper(postEditServiceInfo),
  );
  router.get(
    "/:sid/service-information/edit/confirm",
    csrf,
    isManageUserForService,
    hasGenericRole("manageModifyPolicyCondition"),
    asyncWrapper(getConfirmEditServiceInfo),
  );
  router.post(
    "/:sid/service-information/edit/confirm",
    csrf,
    isManageUserForService,
    hasGenericRole("manageModifyPolicyCondition"),
    asyncWrapper(postConfirmEditServiceInfo),
  );

  // service config
  router.get(
    "/:sid/service-configuration",
    csrf,
    isManageUserForService,
    hasRole("serviceconfig"),
    asyncWrapper(getServiceConfig),
  );
  router.post(
    "/:sid/service-configuration",
    csrf,
    isManageUserForService,
    hasRole("serviceconfig"),
    asyncWrapper(postServiceConfig),
  );

  // service config
  router.get(
    "/:sid/review-service-configuration",
    csrf,
    isManageUserForService,
    hasRole("serviceconfig"),
    asyncWrapper(getConfirmServiceConfig),
  );
  router.post(
    "/:sid/review-service-configuration",
    csrf,
    isManageUserForService,
    hasRole("serviceconfig"),
    asyncWrapper(postConfirmServiceConfig),
  );

  // service banners
  router.get(
    "/:sid/service-banners",
    csrf,
    isManageUserForService,
    hasRole("serviceBanner"),
    asyncWrapper(getServiceBanners),
  );
  router.post(
    "/:sid/service-banners",
    csrf,
    isManageUserForService,
    hasRole("serviceBanner"),
    asyncWrapper(postServiceBanners),
  );

  router.get(
    "/:sid/service-banners/new-banner",
    csrf,
    isManageUserForService,
    hasRole("serviceBanner"),
    asyncWrapper(getNewServiceBanners),
  );
  router.post(
    "/:sid/service-banners/new-banner",
    csrf,
    isManageUserForService,
    hasRole("serviceBanner"),
    asyncWrapper(postNewServiceBanners),
  );

  router.get(
    "/:sid/service-banners/:bid",
    csrf,
    isManageUserForService,
    hasRole("serviceBanner"),
    asyncWrapper(getNewServiceBanners),
  );
  router.post(
    "/:sid/service-banners/:bid",
    csrf,
    isManageUserForService,
    hasRole("serviceBanner"),
    asyncWrapper(postNewServiceBanners),
  );

  router.get(
    "/:sid/service-banners/:bid/delete-banner",
    csrf,
    isManageUserForService,
    hasRole("serviceBanner"),
    asyncWrapper(getDeleteBanner),
  );
  router.post(
    "/:sid/service-banners/:bid/delete-banner",
    csrf,
    isManageUserForService,
    hasRole("serviceBanner"),
    asyncWrapper(postDeleteBanner),
  );

  // service support
  router.get(
    "/:sid/users",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(getUsersSearch),
  );
  router.post(
    "/:sid/users",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(postUsersSearch),
  );

  router.get(
    "/:sid/users/:uid/associate-roles",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(hasInvite),
    asyncWrapper(getAssociateRoles),
  );
  router.post(
    "/:sid/users/:uid/associate-roles",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(hasInvite),
    asyncWrapper(postAssociateRoles),
  );

  router.get(
    "/:sid/users/associate-roles",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(hasInvite),
    asyncWrapper(getAssociateRoles),
  );
  router.post(
    "/:sid/users/associate-roles",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(hasInvite),
    asyncWrapper(postAssociateRoles),
  );

  router.get(
    "/:sid/users/:uid/confirm-details",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(hasInvite),
    asyncWrapper(getConfirmInvitation),
  );
  router.post(
    "/:sid/users/:uid/confirm-details",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(hasInvite),
    asyncWrapper(postConfirmInvitation),
  );

  router.get(
    "/:sid/users/:uid/organisations",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(getUserOrganisations),
  );

  router.get(
    "/:sid/users/:uid/organisations/:oid",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(getEditService),
  );
  router.post(
    "/:sid/users/:uid/organisations/:oid",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(postEditService),
  );

  router.get(
    "/:sid/users/:uid/organisations/:oid/confirm-edit-service",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(getConfirmEditService),
  );
  router.post(
    "/:sid/users/:uid/organisations/:oid/confirm-edit-service",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(postConfirmEditService),
  );

  router.get(
    "/:sid/users/:uid/organisations/:oid/remove-service",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(getRemoveService),
  );
  router.post(
    "/:sid/users/:uid/organisations/:oid/remove-service",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(postRemoveService),
  );

  router.get(
    "/:sid/users/:uid/organisations/:oid/associate-service",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(getAssociateService),
  );
  router.post(
    "/:sid/users/:uid/organisations/:oid/associate-service",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(postAssociateService),
  );

  router.get(
    "/:sid/users/:uid/organisations/:oid/confirm-associate-service",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(getConfirmAssociateService),
  );
  router.post(
    "/:sid/users/:uid/organisations/:oid/confirm-associate-service",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(postConfirmAssociateService),
  );

  router.get(
    "/:sid/users/:uid/web-service-sync",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(getWebServiceSync),
  );
  router.post(
    "/:sid/users/:uid/web-service-sync",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(postWebServiceSync),
  );

  router.get(
    "/:sid/users/:uid/audit",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(getAudit),
  );
  router.post(
    "/:sid/users/:uid/audit",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(postUpdateAuditLog),
  );

  router.get(
    "/:sid/organisations",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(getOrganisationsSearch),
  );
  router.post(
    "/:sid/organisations",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(postOrganisationsSearch),
  );

  router.get(
    "/:sid/organisations/:oid/users",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(getOrganisationUserList),
  );
  router.post(
    "/:sid/organisations/:oid/users",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(postOrganisationUserList),
  );

  router.get(
    "/:sid/organisations/:oid/web-service-sync",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(getWebServiceSyncOrg),
  );
  router.post(
    "/:sid/organisations/:oid/web-service-sync",
    csrf,
    isManageUserForService,
    hasRole("serviceSup"),
    asyncWrapper(postWebServiceSyncOrg),
  );

  // service access management
  router.get(
    "/:sid/policies",
    csrf,
    isManageUserForService,
    hasRole("accessManage"),
    asyncWrapper(getListPolicies),
  );
  router.post(
    "/:sid/policies",
    csrf,
    isManageUserForService,
    hasRole("accessManage"),
    asyncWrapper(postListPolicies),
  );

  router.get(
    "/:sid/policies/:pid/conditionsAndRoles",
    csrf,
    isManageUserForService,
    hasRole("accessManage"),
    asyncWrapper(getPolicyConditions),
  );

  router.get(
    "/:sid/policies/:pid/create-policy-condition",
    csrf,
    isManageUserForService,
    hasGenericRole("manageModifyPolicyCondition"),
    asyncWrapper(getCreatePolicyCondition),
  );

  router.post(
    "/:sid/policies/:pid/create-policy-condition",
    csrf,
    isManageUserForService,
    hasGenericRole("manageModifyPolicyCondition"),
    asyncWrapper(postCreatePolicyCondition),
  );

  router.get(
    "/:sid/policies/:pid/confirm-create-policy-condition",
    csrf,
    isManageUserForService,
    hasGenericRole("manageModifyPolicyCondition"),
    asyncWrapper(getConfirmCreatePolicyCondition),
  );

  router.post(
    "/:sid/policies/:pid/confirm-create-policy-condition",
    csrf,
    isManageUserForService,
    hasGenericRole("manageModifyPolicyCondition"),
    asyncWrapper(postConfirmCreatePolicyCondition),
  );

  router.get(
    "/:sid/policies/:pid/confirm-remove-policy-condition",
    csrf,
    isManageUserForService,
    hasGenericRole("manageModifyPolicyCondition"),
    asyncWrapper(getConfirmRemovePolicyCondition),
  );

  router.post(
    "/:sid/policies/:pid/confirm-remove-policy-condition",
    csrf,
    isManageUserForService,
    hasGenericRole("manageModifyPolicyCondition"),
    asyncWrapper(postConfirmRemovePolicyCondition),
  );

  return router;
};

module.exports = services;
