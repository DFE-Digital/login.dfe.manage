const { emailPolicy } = require('login.dfe.validation');
const { getUserById, getInvitationByEmail } = require('./../../infrastructure/directories');

const get = async (req, res) => {
  const model = {
    csrfToken: req.csrfToken(),
    firstName: '',
    lastName: '',
    email: '',
    backLink: true,
    cancelLink: `/services/${req.params.sid}/users`,
    validationMessages: {},
  };

  if (req.session.user) {
    model.firstName = req.session.user.firstName;
    model.lastName = req.session.user.lastName;
    model.email = req.session.user.email;
  }
  return res.render('services/views/newUserDetails', model);
};

const validate = async (req) => {
  const model = {
    firstName: req.body.firstName || '',
    lastName: req.body.lastName || '',
    email: req.body.email || '',
    uid: '',
    isDSIUser: false,
    backLink: true,
    cancelLink: `/services/${req.params.sid}/users`,
    validationMessages: {},
  };

  if (!model.firstName) {
    model.validationMessages.firstName = 'Please enter a first name'
  }

  if (!model.lastName) {
    model.validationMessages.lastName = 'Please enter a last name';
  }

  if (!model.email) {
    model.validationMessages.email = 'Please enter an email address';
  } else if (!emailPolicy.doesEmailMeetPolicy(model.email)) {
    model.validationMessages.email = 'Please enter a valid email address';
  } else {
    const existingUser = await getUserById(model.email, req.id);
    const existingInvitation = await getInvitationByEmail(model.email, req.id);

    if (existingUser) {
      model.isDSIUser = true;
      model.firstName = existingUser.given_name;
      model.lastName = existingUser.family_name;
      model.email = existingUser.email;
      model.uid = existingUser.sub;
    } else if (existingInvitation) {
      model.isDSIUser = true;
      model.firstName = existingInvitation.firstName;
      model.lastName = existingInvitation.lastName;
      model.email = existingInvitation.email;
      model.uid = `inv-${existingInvitation.id}`;
    }
  }
  return model;
};

const post = async (req, res) => {
  const model = await validate(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    return res.render('services/views/newUserDetails', model);
  }

  if (!req.session.user) {
    req.session.user = {};
  }
  req.session.user.firstName = model.firstName;
  req.session.user.lastName = model.lastName;
  req.session.user.email = model.email;

  if (model.isDSIUser) {
    return res.redirect(`${model.uid}/select-organisation`)
  } else {
    return res.redirect('associate-organisation')
  }
};

module.exports = {
  get,
  post,
};
