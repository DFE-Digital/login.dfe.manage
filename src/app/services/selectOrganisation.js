const { getAllUserOrganisations, getInvitationOrganisations } = require('./../../infrastructure/organisations');
const { getServiceById } = require('./../../infrastructure/applications');

const getOrgsForUser = async (req) => {
  const userId = req.params.uid;
  const userOrganisations = userId.startsWith('inv-') ? await getInvitationOrganisations(userId.substr(4), req.id) : await getAllUserOrganisations(userId, req.id);
  for (let i= 0; i < userOrganisations.length; i++) {
    const org = userOrganisations[i];
    if (org.organisation) {
      org.naturalIdentifiers = [];
      const urn = org.organisation.urn;
      const uid = org.organisation.uid;
      const ukprn = org.organisation.ukprn;
      if (urn) {
        org.naturalIdentifiers.push(`URN: ${urn}`)
      }
      if (uid) {
        org.naturalIdentifiers.push(`UID: ${uid}`)
      }
      if (ukprn) {
        org.naturalIdentifiers.push(`UKPRN: ${ukprn}`)
      }
    }
  }
  return userOrganisations;
};

const get = async (req, res) => {
  if (!req.session.user) {
    return res.redirect(`/services/${req.params.sid}/users`)
  }

  const organisations = await getOrgsForUser(req);

  if (organisations.length === 0) {
    return res.redirect('associate-organisation')
  }

  return res.render('services/views/selectOrganisation', {
    csrfToken: req.csrfToken(),
    backLink: true,
    cancelLink: `/services/${req.params.sid}/users`,
    validationMessages: {},
    user: req.session.user,
    selectedOrganisation: null,
    organisations
  });
};

const validate = async (req) => {
  const userOrganisations = await getOrgsForUser(req);
  const selectedOrg = req.body.selectedOrganisation;
  const model = {
    selectedOrganisation: selectedOrg,
    user: req.session.user,
    organisations: userOrganisations,
    backLink: true,
    cancelLink: `/services/${req.params.sid}/users`,
    validationMessages: {},
  };

  if (model.selectedOrganisation === undefined || model.selectedOrganisation === null) {
    model.validationMessages.selectedOrganisation = 'Please select an organisation'
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
    return res.render('services/views/selectOrganisation', model);
  }
  const selectedOrgDetails = model.organisations.find(x => x.organisation.id === model.selectedOrganisation);
  const service = await getServiceById(req.params.sid, req.id);


  req.session.user.organisationId = model.selectedOrganisation;
  req.session.user.organisationName = selectedOrgDetails ? selectedOrgDetails.organisation.name : undefined;
  req.session.user.service = service ? service.name : undefined;

  return res.redirect('associate-roles')
};

module.exports = {
  get,
  post,
};