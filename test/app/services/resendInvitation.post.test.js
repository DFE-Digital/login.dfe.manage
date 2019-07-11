jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/app/services/utils');

jest.mock('./../../../src/infrastructure/search', () => {
  return {
    updateIndex: jest.fn(),
  };
});

jest.mock('./../../../src/infrastructure/directories', () => ({
  getUserById: jest.fn(),
  getInvitationByEmail: jest.fn(),
  resendInvitation: jest.fn(),
  updateInvite: jest.fn(),
}));

const { getRequestMock, getResponseMock } = require('./../../utils');
const { getUserDetails } = require('./../../../src/app/services/utils');
const { updateIndex } = require('./../../../src/infrastructure/search');
const { getUserById, getInvitationByEmail, resendInvitation, updateInvite } = require('./../../../src/infrastructure/directories');
const logger = require('./../../../src/infrastructure/logger');
const postResendInvitation = require('./../../../src/app/services/resendInvitation').post;

const res = getResponseMock();

describe('when resending an invitation', () => {

  let req;


  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: 'user1',
        sid: 'service1',
        orgId: 'org1',
      },
      body: {
        email: 'johndoe@gmail.com',
      }
    });

    getUserById.mockReset().mockReturnValue(null);
    getInvitationByEmail.mockReset().mockReturnValue(null);
    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: 'user1',
      email: 'johndoeold@gmail.com'
    });

  });

  it('then it should get the user details', async () => {
    await postResendInvitation(req, res);

    expect(getUserDetails.mock.calls).toHaveLength(1);
  });

  it('then it should render view if email not entered', async () => {
    req.body.email = '';

    await postResendInvitation(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/confirmResendInvitation');
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: 'token',
      email: '',
      user: {
        email: 'johndoeold@gmail.com',
        id: 'user1'
      },
      backLink: true,
      noChangedEmail: false,
      validationMessages: {
        email: 'Please enter an email address',
      },
    });
  });

  it('then it should render view if email not a valid email address', async () => {
    req.body.email = 'not-an-email';

    await postResendInvitation(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/confirmResendInvitation');
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: 'token',
      email: 'not-an-email',
      user: {
        email: 'johndoeold@gmail.com',
        id: 'user1'
      },
      backLink: true,
      noChangedEmail: false,
      validationMessages: {
        email: 'Please enter a valid email address',
      },
    });
  });

  it('then it should render view if email already associated to a user', async () => {
    getUserById.mockReturnValue({
      sub: 'user1',
    });

    await postResendInvitation(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/confirmResendInvitation');
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: 'token',
      email: 'johndoe@gmail.com',
      user: {
        email: 'johndoeold@gmail.com',
        id: 'user1'
      },
      backLink: true,
      noChangedEmail: false,
      validationMessages: {
        email: 'A DfE Sign-in user already exists with that email address',
      },
    });
  });

  it('then it should render view if email already associated to a invitation', async () => {
    getInvitationByEmail.mockReturnValue({
      id: 'inv1',
    });

    await postResendInvitation(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/confirmResendInvitation');
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: 'token',
      email: 'johndoe@gmail.com',
      user: {
        email: 'johndoeold@gmail.com',
        id: 'user1'
      },
      backLink: true,
      noChangedEmail: false,
      validationMessages: {
        email: 'A DfE Sign-in user already exists with that email address',
      },
    });
  });

  it('then it should resend invite if email not changed', async () => {
    req.params.uid = 'inv-user1';
    req.body.email = 'johndoeold@gmail.com';
    await postResendInvitation(req, res);

    expect(resendInvitation.mock.calls).toHaveLength(1);
    expect(resendInvitation.mock.calls[0][0]).toBe('user1');
  });

  it('then it should update invite with new email if email changed', async () => {
    req.params.uid = 'inv-user1';

    await postResendInvitation(req, res);

    expect(updateInvite.mock.calls).toHaveLength(1);
    expect(updateInvite.mock.calls[0][0]).toBe('user1');
    expect(updateInvite.mock.calls[0][1]).toBe('johndoe@gmail.com');
  });

  it('then it should update the search index with the new email if email changed', async () => {

    await postResendInvitation(req,res);
    expect(updateIndex.mock.calls).toHaveLength(1);
    expect(updateIndex.mock.calls[0][0]).toBe('user1');
    expect(updateIndex.mock.calls[0][1]).toEqual({ email: 'johndoe@gmail.com'});
    expect(updateIndex.mock.calls[0][2]).toEqual('correlationId');
  });

  it('then it should should audit resent invitation', async () => {
    await postResendInvitation(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe('user@unit.test (id: user1) resent invitation email to  johndoe@gmail.com (id: user1)');
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: 'manage',
      subType: 'resent-invitation',
      userId: 'user1',
      userEmail: 'user@unit.test',
      invitedUser: 'user1',
      invitedUserEmail: 'johndoe@gmail.com',
    });
  });

  it('then it should redirect to user details', async () => {
    await postResendInvitation(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('/services/service1/users/user1/organisations');
  });

  it('then a flash message is shown to the user', async () => {
    await postResendInvitation(req, res);

    expect(res.flash.mock.calls).toHaveLength(1);
    expect(res.flash.mock.calls[0][0]).toBe('info');
    expect(res.flash.mock.calls[0][1]).toBe('Invitation email sent to johndoe@gmail.com');
  });
});
