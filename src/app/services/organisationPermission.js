const { getServiceById } = require('./../../infrastructure/applications');

const get = async (req, res) => {
  if (!req.session.user) {
    return res.redirect(`/services/${req.params.sid}/users`)
  }
  const service = await getServiceById(req.params.sid, req.id);

  return res.render('services/views/organisationPermission', {
    csrfToken: req.csrfToken(),
    backLink: true,
    cancelLink: `/services/${req.params.sid}/users`,
    user: `${req.session.user.firstName} ${req.session.user.lastName}`,
    organisation: req.session.user.organisationName,
    service,
    selectedLevel: null,
    validationMessages: {},
  })
};

const validate = async (req) => {
  const validPermissionLevels = [0, 10000];

  const level = parseInt(req.body.selectedLevel);
  const service = await getServiceById(req.params.sid, req.id);

  const model = {
    backLink: true,
    cancelLink: `/services/${req.params.sid}/users`,
    user: `${req.session.user.firstName} ${req.session.user.lastName}`,
    organisation: req.session.user.organisationName,
    service,
    selectedLevel: isNaN(level) ? undefined : level,
    validationMessages: {},
  };

  if (model.selectedLevel === undefined || model.selectedLevel === null) {
    model.validationMessages.selectedLevel = 'Please select a permission level';
  } else if (validPermissionLevels.find(x => x === model.selectedLevel) === undefined) {
    model.validationMessages.selectedLevel = 'Please select a permission level';
  }
  return model;
};

const post = async (req, res) => {
  if (!req.session.user) {
    return res.redirect(`/services/${req.params.sid}/users`)
  }
  const model = await validate(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render('services/views/organisationPermission', model);
  }

  req.session.user.permission = model.selectedLevel;
  return res.redirect('associate-roles')
};

module.exports = {
  get,
  post,
};
