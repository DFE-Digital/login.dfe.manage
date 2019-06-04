jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/applications');

const { getRequestMock, getResponseMock } = require('./../../utils');
const res = getResponseMock();
const getOrganisationPermission = require('./../../../src/app/services/organisationPermission').get;
const { getServiceById } = require('./../../../src/infrastructure/applications');

describe('when displaying the select permission page', () => {

  let req;

  beforeEach(() => {
    req = getRequestMock({
      session: {
        user: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          organisationName: 'org name',
        }
      },
      params: {
        uid: 'user1',
        sid: 'service1'
      }
    });

    getServiceById.mockReset();
    getServiceById.mockReturnValue({
      id: 'service1',
      dateActivated: '10/10/2018',
      name: 'service name',
      status: 'active',
    });
  });

  it('then it should get the service details by id', async () => {
    await getOrganisationPermission(req, res);

    expect(getServiceById.mock.calls).toHaveLength(1);
    expect(getServiceById.mock.calls[0][0]).toBe('service1');
    expect(getServiceById.mock.calls[0][1]).toBe('correlationId');
  });

  it('then it should return the confirm edit services view', async () => {
    req.session.user = undefined;
    await getOrganisationPermission(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe('/services/service1/users');
  });

  it('then it should include csrf token', async () => {
    await getOrganisationPermission(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('then it should include the user details from session', async () => {
    await getOrganisationPermission(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      user: 'John Doe'
    });
  });

  it('then it should include the org details from session', async () => {
    await getOrganisationPermission(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      organisation: 'org name'
    });
  });

  it('then it should include the service details', async () => {
    await getOrganisationPermission(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      service: {
        id: 'service1',
        dateActivated: '10/10/2018',
        name: 'service name',
        status: 'active',
      }
    });
  });
});
