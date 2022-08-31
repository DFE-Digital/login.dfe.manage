jest.mock('./../../../src/infrastructure/config', () => require('../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('../../utils').loggerMockFactory());
jest.mock('./../../../src/app/services/utils');
jest.mock('login.dfe.policy-engine');
jest.mock('../../../src/infrastructure/applications');

const PolicyEngine = require('login.dfe.policy-engine');
const { getRequestMock, getResponseMock } = require('../../utils');
const { getServiceById } = require('../../../src/infrastructure/applications');

const policyEngine = {
  getPolicyApplicationResultsForUser: jest.fn(),
  validate: jest.fn(),
};
describe('when associating a service with user', () => {
  let req;
  let res;

  let postAssociateService;

  beforeEach(() => {
    req = getRequestMock();
    req.params = {
      uid: 'user1',
      oid: 'org1',
      sid: 'service1',
    };

    getServiceById.mockReset();
    getServiceById.mockReturnValue({
      id: 'service1',
      name: 'Service One',
    });

    res = getResponseMock();

    policyEngine.getPolicyApplicationResultsForUser.mockReset().mockReturnValue({
      rolesAvailableToUser: ['role1', 'role2'],
    });
    PolicyEngine.mockReset().mockImplementation(() => policyEngine);

    postAssociateService = require('../../../src/app/services/associateService').post;
  });
  it('then it should render a view with error if selection is not valid', async () => {
    policyEngine.validate.mockReturnValue([{ message: 'selections not valid' }]);

    await postAssociateService(req, res);

    expect(res.redirect.mock.calls).toHaveLength(0);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/associateService');
    expect(res.render.mock.calls[0][1]).toMatchObject({
      validationMessages: {
        roles: ['selections not valid'],
      },
    });
  });

  it('then it should redirect to confirm details if selection is valid', async () => {
    policyEngine.validate.mockReturnValue([]);
    await postAssociateService(req, res);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('confirm-associate-service');
  });
});
