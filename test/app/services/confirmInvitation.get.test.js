jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/access', () => {
  return {
    listRolesOfService: jest.fn(),
  };
});


const { getRequestMock, getResponseMock } = require('./../../utils');
const { listRolesOfService } = require('./../../../src/infrastructure/access');
const res = getResponseMock();
const getConfirmInvitation = require('./../../../src/app/services/confirmInvitation').get;

describe('when displaying the confirm invitation view', () => {

  let req;

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
          email: 'john.doe@unit.test',
          service: 'service name',
          organisationName: 'organisation name',
          organisationId: 'org1',
          permission: 10000,
          roles: [
            'role_id',
          ],
        },
      },
    });

    listRolesOfService.mockReset();
    listRolesOfService.mockReturnValue([{
      code: 'role_code',
      id: 'role_id',
      name: 'role_name',
      status: {
        id: 'status_id'
      },
    }]);
  });

  it('then it should redirect to users list if no user in session', async () => {
    req.session.user = undefined;
    await getConfirmInvitation(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe('/services/service1/users');
  });

  it('then it should get the selected roles details', async () => {
    await getConfirmInvitation(req, res);

    expect(listRolesOfService.mock.calls).toHaveLength(1);
    expect(listRolesOfService.mock.calls[0][0]).toBe('service1');
    expect(listRolesOfService.mock.calls[0][1]).toBe('correlationId');
  });

  it('then it should return the confirm invitation view', async () => {
    await getConfirmInvitation(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/confirmInvitation');
  });

  it('then it should include csrf token', async () => {
    await getConfirmInvitation(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('then it should include the user details from session', async () => {
    await getConfirmInvitation(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      user: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@unit.test',
        isExistingUser: 'user1',
      },
    });
  });

  it('then it should include the service details from session', async () => {
    await getConfirmInvitation(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      service: {
        name: 'service name',
        roles: [
          {
            code: 'role_code',
            id: 'role_id',
            name: 'role_name',
            status: {
              id: 'status_id'
            },
          }
        ],
      },
    });
  });

  it('then it should include the org details from session', async () => {
    await getConfirmInvitation(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      organisation: {
        name: 'organisation name',
        permissionLevel: 'Approver'
      },
    });
  });
});
