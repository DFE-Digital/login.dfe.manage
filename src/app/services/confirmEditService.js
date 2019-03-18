const { getServiceById } = require('./../../infrastructure/applications');
const { listRolesOfService, updateUserService, updateInvitationService } = require('./../../infrastructure/access');
const { getUserDetails } = require('./utils');
const { getOrganisationByIdV2 } = require('./../../infrastructure/organisations');

const get = async (req, res) => {
  const service = await getServiceById(req.params.sid, req.id);
  const allRolesForService = await listRolesOfService(req.params.sid, req.id);
  const selectedRoleIds = req.session.service.roles;
  const roleDetails = allRolesForService.filter(x => selectedRoleIds.find(y => y.toLowerCase() === x.id.toLowerCase()));
  const organisation = await getOrganisationByIdV2(req.params.oid, req.id);
  const user = await getUserDetails(req);

  return res.render('services/views/confirmEditService', {
    csrfToken: req.csrfToken(),
    backLink: true,
    cancelLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    service,
    roles: roleDetails,
    user,
    organisation,
  });
};

const post = async (req, res) => {
  const selectedRoles = req.session.service.roles;
  req.params.uid.startsWith('inv-') ? await updateInvitationService(req.params.uid.substr(4), req.params.sid, req.params.oid, selectedRoles, req.id) :
    updateUserService(req.params.uid, req.params.sid, req.params.oid, selectedRoles, req.id);

  //TODO: audit edit service

  res.flash('info', 'Service roles updated successfully');
  return res.redirect(`/services/${req.params.sid}/users/${req.params.uid}/organisations`);
};

module.exports = {
  get,
  post,
};
