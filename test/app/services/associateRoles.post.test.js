jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('login.dfe.policy-engine');

const { getRequestMock, getResponseMock } = require('./../../utils');
const PolicyEngine = require('login.dfe.policy-engine');

const policyEngine = {
  getPolicyApplicationResultsForUser: jest.fn(),
  validate: jest.fn(),
};

describe('when selecting the roles for a service', () => {

  let req;
  let res;

  let postAssociateRoles;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: 'user1',
        sid: 'service1',
      },
      session: {
        user: {
          firstName: 'John',
          lastName: 'Doe',
          service: 'service name',
          organisationName: 'organisation name',
          organisationId: 'org1',
        }
      }
    });
    res = getResponseMock();

    policyEngine.getPolicyApplicationResultsForUser.mockReset().mockReturnValue({
      rolesAvailableToUser: [],
    });
    policyEngine.validate.mockReturnValue([]);

    PolicyEngine.mockReset().mockImplementation(() => policyEngine);


    postAssociateRoles = require('./../../../src/app/services/associateRoles').post;
  });

  it('then it should redirect to users list if no user in session', async () => {
    req.session.user = undefined;
    await postAssociateRoles(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe('/services/service1/users');
  });

  it('then it should render view with error if selection do not meet requirements of service', async () => {
    policyEngine.validate.mockReturnValue([{ message: 'selections not valid' }]);

    await postAssociateRoles(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe(`services/views/associateRoles`);
    expect(res.render.mock.calls[0][1]).toMatchObject({
      validationMessages: {
        roles: ['selections not valid'],
      },
    });
  });

  it('then it should redirect to confirm new user page if no uid', async () => {
    req.params.uid = undefined;
    await postAssociateRoles(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('confirm-new-user');
  });

  it('then it should redirect to confirm details if existing user', async () => {
    await postAssociateRoles(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('confirm-details');
  });
});
