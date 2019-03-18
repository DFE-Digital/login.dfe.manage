const { removeServiceFromUser, removeServiceFromInvitation } = require('./../../infrastructure/access');
const { getServiceById } = require('./../../infrastructure/applications');
const { getUserDetails } = require('./utils');
const { getOrganisationByIdV2 } = require('./../../infrastructure/organisations');

const getModel = async (req) => {
  const service = await getServiceById(req.params.sid, req.id);
  const user = await getUserDetails(req);
  const organisation = await getOrganisationByIdV2(req.params.oid, req.id);

  return {
    backLink: true,
    cancelLink: `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
    csrfToken: req.csrfToken(),
    organisation,
    user,
    service,
  };
};

const get = async (req, res) => {
  const model = await getModel(req);
  return res.render('services/views/removeService', model);
};

const post = async (req, res) => {
  const model = await getModel(req);
  req.params.uid.startsWith('inv-') ? await removeServiceFromInvitation(req.params.uid.substr(4), req.params.sid, req.params.oid, req.id) :
    await removeServiceFromUser(req.params.uid, req.params.sid, req.params.oid, req.id);

  //TODO: audit remove service

  res.flash('info', `${model.user.firstName} ${model.user.lastName} removed from ${model.service.name}`);
  return res.redirect(`/services/${req.params.sid}/users/${req.params.uid}/organisations`);
};

module.exports = {
  get,
  post,
};
