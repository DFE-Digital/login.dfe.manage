const { getServiceById } = require('./../../infrastructure/applications');
const { listRolesOfService, updateUserService, updateInvitationService } = require('./../../infrastructure/access');
const { getUserDetails } = require('./utils');
const { getOrganisationByIdV2 } = require('./../../infrastructure/organisations');
const logger = require('./../../infrastructure/logger');


const getModel = async (req) => {
  const service = await getServiceById(req.params.sid, req.id);
  const allRolesForService = await listRolesOfService(req.params.sid, req.id);
  const selectedRoleIds = req.session.service.roles;
  const roleDetails = allRolesForService.filter(x => selectedRoleIds.find(y => y.toLowerCase() === x.id.toLowerCase()));
  const organisation = await getOrganisationByIdV2(req.params.oid, req.id);
  const user = await getUserDetails(req);

  return {
    csrfToken: req.csrfToken(),
    backLink: true,
    cancelLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    service,
    roles: roleDetails,
    user,
    organisation,
  }
};

const get = async (req, res) => {
  const model = await getModel(req);

  return res.render('services/views/confirmEditService', model);
};

const post = async (req, res) => {
  const model = await getModel(req);

  const selectedRoles = req.session.service.roles;
  req.params.uid.startsWith('inv-') ? await updateInvitationService(req.params.uid.substr(4), req.params.sid, req.params.oid, selectedRoles, req.id) :
    updateUserService(req.params.uid, req.params.sid, req.params.oid, selectedRoles, req.id);

  logger.audit(`${req.user.email} (id: ${req.user.sub}) updated service ${model.service.name} for organisation ${model.organisation.name} (id: ${model.organisation.id}) for user ${model.user.email} (id: ${model.user.id})`, {
    type: 'manage',
    subType: 'user-service-updated',
    userId: req.user.sub,
    userEmail: req.user.email,
    editedUser: model.user.id,
    editedFields: [{
      name: 'update_service',
      newValue: selectedRoles,
    }],
  });

  res.flash('info', 'Service roles updated successfully');
  return res.redirect(`/services/${req.params.sid}/users/${req.params.uid}/organisations`);
};

module.exports = {
  get,
  post,
};
