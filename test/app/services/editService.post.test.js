jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('login.dfe.policy-engine');
jest.mock('./../../../src/app/services/utils');
jest.mock('./../../../src/infrastructure/access');
jest.mock('./../../../src/infrastructure/applications');
jest.mock('./../../../src/infrastructure/organisations');

const { getRequestMock, getResponseMock } = require('./../../utils');
const PolicyEngine = require('login.dfe.policy-engine');
const { getSingleUserService, getSingleInvitationService } = require('./../../../src/infrastructure/access');
const { getServiceById } = require('./../../../src/infrastructure/applications');
const { getOrganisationByIdV2 } = require('./../../../src/infrastructure/organisations');

const policyEngine = {
  validate: jest.fn(),
  getPolicyApplicationResultsForUser: jest.fn(),
};

describe('when selecting the roles for a service', () => {

  let req;
  let res;
  let postEditService;

  beforeEach(() => {
    req = getRequestMock();
    req.params = {
      uid: 'user1',
      oid: 'org1',
      sid: 'service1',
    };
    req.body = {
      role: [
        'role1',
      ]
    };
    getSingleUserService.mockReset();
    getSingleUserService.mockReturnValue({
      id: 'service1',
      dateActivated: '10/10/2018',
      name: 'service name',
      status: 'active',
    });

    getSingleInvitationService.mockReset();
    getSingleInvitationService.mockReturnValue({
      id: 'service1',
      dateActivated: '10/10/2018',
      name: 'service name',
      status: 'active'
    });

    getServiceById.mockReset();
    getServiceById.mockReturnValue({
      serviceId: 'service1',
      name: 'service one',
      description: 'service description',
      relyingParty: {
        client_id: 'clientid',
        client_secret: 'dewier-thrombi-confounder-mikado',
        api_secret: 'dewier-thrombi-confounder-mikado',
        service_home: 'https://www.servicehome.com',
        postResetUrl: 'https://www.postreset.com',
        redirect_uris: [
          'https://www.redirect.com',
        ],
        post_logout_redirect_uris: [
          'https://www.logout.com',
        ],
        grant_types: [
          'implicit',
          'authorization_code'
        ],
        response_types: [
          'code',
        ],
      }
    });
    getOrganisationByIdV2.mockReset();
    getOrganisationByIdV2.mockReturnValue({
      id: 'org-1',
      name: 'organisation one'
    });

    res = getResponseMock();

    policyEngine.validate.mockReset().mockReturnValue([]);
    policyEngine.getPolicyApplicationResultsForUser.mockReset().mockReturnValue({
      rolesAvailableToUser: ['role1'],
    });
    PolicyEngine.mockReset().mockImplementation(() => policyEngine);

    postEditService = require('./../../../src/app/services/editService').post;
  });

  it('then it should render view with error if selection do not meet requirements of service', async () => {
    policyEngine.validate.mockReturnValue([{ message: 'selections not valid' }]);

    await postEditService(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe(`services/views/editService`);

  });

  it('then it should redirect to confirm page if roles valid', async () => {
    await postEditService(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`org1/confirm-edit-service`);
  });
});
