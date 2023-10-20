'use strict';

const { getServiceById } = require('../../infrastructure/applications');
const { getUserServiceRoles } = require('./utils');
const { deleteRedirectUrlsFromStorage } = require('../../infrastructure/utils/serviceConfigCache');
const { REDIRECT_URLS_CHANGES } = require('../../constants/serviceConfigConstants');
const logger = require('../../infrastructure/logger/index');

const getDashboard = async (req, res) => {
  if (req.session.serviceConfigurationChanges) {
    req.session.serviceConfigurationChanges = {};
  }
  // remove service redirect URLs configuration chages form node storgage if they exist
  try {
    await deleteRedirectUrlsFromStorage(REDIRECT_URLS_CHANGES, req.params.sid);
  } catch (error) {
    logger.error(`Error occurred while removing redirect URLs from local storage for service ID - ${req.params.sid}:`, error);
  }

  const serviceDetails = await getServiceById(req.params.sid, req.id);
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render('services/views/dashboard.ejs', {
    csrfToken: req.csrfToken(),
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    serviceDetails,
    currentNavigation: 'dashboard',
  });
};

module.exports = {
  getDashboard,
};
