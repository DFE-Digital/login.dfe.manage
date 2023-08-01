const applications = [];

const mapServiceFieldsToAttributes = (fields) => fields.map((field) => {
  let mappedField = '';
  switch (field) {
    case 'id':
    case 'name':
    case 'description':
    case 'isExternalService':
    case 'isMigrated':
    case 'parentId':
      mappedField = field;
      break;
    case 'assertions':
      mappedField = 'saml';
      break;
    case 'clientId':
      mappedField = 'relyingParty.client_id';
      break;
    case 'clientSecret':
      mappedField = 'relyingParty.client_secret';
      break;
    case 'apiSecret':
      mappedField = 'relyingParty.api_secret';
      break;
    case 'tokenEndpointAuthMethod':
      mappedField = 'relyingParty.token_endpoint_auth_method';
      break;
    case 'serviceHome':
      mappedField = 'relyingParty.service_home';
      break;
    case 'postResetUrl':
      mappedField = 'relyingParty.postResetUrl';
      break;
    case 'redirects':
      mappedField = 'relyingParty.redirect_uris';
      break;
    case 'postLogoutRedirects':
      mappedField = 'relyingParty.post_logout_redirect_uris';
      break;
    case 'grantTypes':
      mappedField = 'relyingParty.grant_types';
      break;
    case 'responseTypes':
      mappedField = 'relyingParty.response_types';
      break;
    case 'params':
      mappedField = 'relyingParty.params';
      break;
    default:
      mappedField = '';
  }
  return mappedField;
});

const getServiceById = async (idOrClientId, correlationId) => applications.find(
  (a) => a.id.toLowerCase() === idOrClientId.toLowerCase()
  || (a.relyingParty && a.relyingParty.clientId.toLowerCase() === idOrClientId.toLowerCase()),
);

const getServiceSummaries = async (ids, fields, correlationId) => {
  const lowercaseIds = ids.map((id) => id.toLowerCase());
  const foundApps = applications.filter((a) => lowercaseIds.includes(a.id.toLowerCase())
    || (a.relyingParty && lowercaseIds.includes(a.relyingParty.clientId.toLowerCase())));
  const requiredAttributes = mapServiceFieldsToAttributes(fields);
  return foundApps.map((app) => {
    const appWithAttributes = {};
    requiredAttributes.forEach((field) => {
      const splitField = field.split('.');
      if (splitField.length === 1) {
        appWithAttributes[splitField] = app[splitField];
      } else {
        if (typeof appWithAttributes[splitField[0]] === 'undefined') {
          appWithAttributes[splitField[0]] = {};
        }
        appWithAttributes[splitField[0]][splitField[1]] = app[splitField[0]][splitField[1]];
      }
    });
    return appWithAttributes;
  });
};

const updateService = async (id, body, correlationId) => Promise.resolve(null);

const listAllServices = async (correlationId) => Promise.resolve(null);

const listBannersForService = async (id, pageSize, page, correlationId) => Promise.resolve({
  banners: {
    id: 'bannerId',
    serviceId: 'serviceId',
    name: 'banner name',
    title: 'banner title',
    message: 'banner message',
  },
  page,
  totalNumberOfPages: 1,
  totalNumberOfRecords: 1,
});

const getBannerById = async (id, bid, correlationId) => Promise.resolve(null);

const upsertBanner = async (sid, banner, correlationId) => Promise.resolve(null);

const removeBanner = async (sid, bid, correlationId) => Promise.resolve(null);

const listAllBannersForService = async (id, correlationId) => listBannersForService(id, 25, 1, correlationId)
  .banners
  .find((x) => x.id === id);

module.exports = {
  getServiceById,
  getServiceSummaries,
  updateService,
  listAllServices,
  listBannersForService,
  getBannerById,
  upsertBanner,
  removeBanner,
  listAllBannersForService,
};
