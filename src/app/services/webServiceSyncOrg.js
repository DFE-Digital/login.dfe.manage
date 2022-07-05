const ServiceNotificationsClient = require('login.dfe.service-notifications.jobs.client');
const config = require('../../infrastructure/config');
const { getOrganisationByIdV2 } = require('../../infrastructure/organisations');
const { getUserServiceRoles } = require('./utils');

const get = async (req, res) => {
  const organisation = await getOrganisationByIdV2(req.params.oid, req.id);
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render('services/views/webServiceSyncOrg', {
    csrfToken: req.csrfToken(),
    backLink: true,
    organisation,
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentPage: 'web-service-sync-organisation',
  });
};
const post = async (req, res) => {
  const organisation = await getOrganisationByIdV2(req.params.oid, req.id);

  const serviceNotificationsClient = new ServiceNotificationsClient(config.notifications);
  await serviceNotificationsClient.notifyOrganisationUpdated(organisation);

  res.flash('info', 'Organisation has been queued for sync');
  return res.redirect(`/services/${req.params.sid}/organisations/${organisation.id}/users`);
};
module.exports = {
  get,
  post,
};
