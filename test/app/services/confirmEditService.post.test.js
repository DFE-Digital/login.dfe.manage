jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());

jest.mock('./../../../src/infrastructure/access', () => {
  return {
    updateUserService: jest.fn(),
    updateInvitationService: jest.fn(),
  };
});

const { getRequestMock, getResponseMock } = require('./../../utils');
const { updateInvitationService, updateUserService } = require('./../../../src/infrastructure/access');
const res = getResponseMock();

describe('when editing a service for a user', () => {

  let req;

  let postConfirmEditService;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: 'user1',
        oid: 'org1',
        sid: 'service1',
      },
      session: {
        service: {
          roles: ['role_id']
        },
      },
    });

    updateUserService.mockReset();
    updateInvitationService.mockReset();

    res.mockResetAll();

    postConfirmEditService = require('./../../../src/app/services/confirmEditService').post;
  });

  it('then it should edit service for invitation if request for invitation', async () => {
    req.params.uid = 'inv-invite1';

    await postConfirmEditService(req, res);

    expect(updateInvitationService.mock.calls).toHaveLength(1);
    expect(updateInvitationService.mock.calls[0][0]).toBe('invite1');
    expect(updateInvitationService.mock.calls[0][1]).toBe('service1');
    expect(updateInvitationService.mock.calls[0][2]).toBe('org1');
    expect(updateInvitationService.mock.calls[0][3]).toEqual(["role_id"]);
    expect(updateInvitationService.mock.calls[0][4]).toBe('correlationId');
  });

  it('then it should edit service for user if request for user', async () => {

    await postConfirmEditService(req, res);

    expect(updateUserService.mock.calls).toHaveLength(1);
    expect(updateUserService.mock.calls[0][0]).toBe('user1');
    expect(updateUserService.mock.calls[0][1]).toBe('service1');
    expect(updateUserService.mock.calls[0][2]).toBe('org1');
    expect(updateUserService.mock.calls[0][3]).toEqual(["role_id"]);
    expect(updateUserService.mock.calls[0][4]).toBe('correlationId');
  });

  it('then it should redirect to user details', async () => {
    await postConfirmEditService(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`/services/${req.params.sid}/users/${req.params.uid}/organisations`);
  });

  it('then a flash message is shown to the user', async () => {
    await postConfirmEditService(req, res);

    expect(res.flash.mock.calls).toHaveLength(1);
    expect(res.flash.mock.calls[0][0]).toBe('info');
    expect(res.flash.mock.calls[0][1]).toBe(`Service roles updated successfully`)
  });
});
