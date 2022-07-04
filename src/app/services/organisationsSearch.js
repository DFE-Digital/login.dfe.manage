const { searchOrganisations } = require('../../infrastructure/organisations');
const { getUserServiceRoles } = require('../../utils/getUserServiceRoles');

const buildModel = async (req) => {
  const inputSource = req.method.toUpperCase() === 'POST' ? req.body : req.query;
  const criteria = inputSource.criteria ? inputSource.criteria.trim() : '';
  const manageRolesForService = await getUserServiceRoles(req);

  let pageNumber = parseInt(inputSource.page, 10) || 1;
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
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentPage: '',
  };
};

const get = async (req, res) => {
  const model = await buildModel(req);
  return res.render('services/views/organisationsSearch', model);
};

const post = async (req, res) => {
  const model = await buildModel(req);
  return res.render('services/views/organisationsSearch', model);
};

module.exports = {
  get,
  post,
};
