jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/app/services/utils');


const { getRequestMock, getResponseMock } = require('./../../utils');
const { getUserDetails } = require('./../../../src/app/services/utils');
const getResendInvitation = require('./../../../src/app/services/resendInvitation').get;

const res = getResponseMock();

describe('when displaying the resend invitation view', () => {

  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: 'user1',
        sid: 'service1',
      },
    });

    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: 'user1',
    });
  });

  it('then it should return the confirm resend invitation view', async () => {
    await getResendInvitation(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/confirmResendInvitation');
  });

  it('then it should include csrf token', async () => {
    await getResendInvitation(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('then it should get the user details', async () => {
    await getResendInvitation(req, res);

    expect(getUserDetails.mock.calls).toHaveLength(1);
  });
});
