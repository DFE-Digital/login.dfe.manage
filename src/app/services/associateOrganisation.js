const PolicyEngine = require('login.dfe.policy-engine');
const config = require('../../infrastructure/config');

const policyEngine = new PolicyEngine(config);
const { searchOrganisations, getOrganisationByIdV2, getOrganisationForUserV2 } = require('../../infrastructure/organisations');
const { getUserServiceRoles } = require('./utils');

const buildModel = async (req) => {
  const manageRolesForService = await getUserServiceRoles(req);
  const inputSource = req.method.toUpperCase() === 'POST' ? req.body : req.query;
  const criteria = inputSource.criteria ? inputSource.criteria.trim() : '';
  let pageNumber = parseInt(inputSource.page) || 1;
  if (isNaN(pageNumber)) {
    pageNumber = 1;
  }
  const pageOfOrganisations = await searchOrganisations(criteria, undefined, pageNumber, req.id);
  return {
    csrfToken: req.csrfToken(),
    backLink: true,
    criteria,
    page: pageNumber,
    numberOfPages: pageOfOrganisations.totalNumberOfPages,
    totalNumberOfResults: pageOfOrganisations.totalNumberOfRecords,
    organisations: pageOfOrganisations.organisations,
    validationMessages: {},
    userRoles: manageRolesForService,
    currentNavigation: 'users',
    serviceId: req.params.sid,
  };
};

const get = async (req, res) => {
  if (!req.session.user) {
    return res.redirect(`/services/${req.params.sid}/users`);
  }

  const model = await buildModel(req);
  return res.render('services/views/associateOrganisation', model);
};

const post = async (req, res) => {
  if (!req.session.user) {
    return res.redirect(`/services/${req.params.sid}/users`);
  }
  const model = await buildModel(req);

  if (req.body.selectedOrganisation) {
    const userOrganisations = (req.params.uid && !req.params.uid.startsWith('inv-')) ? await getOrganisationForUserV2(req.params.uid, req.id) : undefined;
    const userAccessToSpecifiedOrganisation = userOrganisations ? userOrganisations.find((x) => x.organisation.id.toLowerCase() === req.body.selectedOrganisation.toLowerCase()) : undefined;

    if (!userAccessToSpecifiedOrganisation) {
      const policyResult = await policyEngine.getPolicyApplicationResultsForUser(userAccessToSpecifiedOrganisation ? req.params.uid : undefined, req.body.selectedOrganisation, req.params.sid, req.id);
      if (policyResult.rolesAvailableToUser.length > 0) {
        const organisation = req.body.selectedOrganisation ? await getOrganisationByIdV2(req.body.selectedOrganisation) : undefined;
        req.session.user.organisationName = organisation ? organisation.name : undefined;
        req.session.user.organisationId = req.body.selectedOrganisation;
        return res.redirect('organisation-permissions');
      }
      model.validationMessages.organisation = 'The organisation you have selected does not have access to this service';
      return res.render('services/views/associateOrganisation', model);
    }
    model.validationMessages.organisation = `The user was already mapped to ${userAccessToSpecifiedOrganisation.organisation.name}`;
    return res.render('services/views/associateOrganisation', model);
  }
  return res.render('services/views/associateOrganisation', model);
};

module.exports = {
  get,
  post,
};
