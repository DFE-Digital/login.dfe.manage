jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());

jest.mock('./../../../src/infrastructure/directories', () => ({
  getUserById: jest.fn(),
  getInvitationByEmail: jest.fn(),
}));

const { getRequestMock, getResponseMock } = require('./../../utils');
const res = getResponseMock();
const { getUserById, getInvitationByEmail } = require('./../../../src/infrastructure/directories');
const postNewUserDetails = require('./../../../src/app/services/newUserDetails').post;


describe('when entering a new users details', () => {

  let req;


  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: 'service1',
      },
      body: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@gmail.com',
      }
    });

    getUserById.mockReset().mockReturnValue(null);
    getInvitationByEmail.mockReset().mockReturnValue(null);
  });

  it('then it should include user details in session', async () => {
    await postNewUserDetails(req, res);

    expect(req.session.user).not.toBeNull();
    expect(req.session.user.firstName).toBe('John');
    expect(req.session.user.lastName).toBe('Doe');
    expect(req.session.user.email).toBe('johndoe@gmail.com');
  });

  it('then it should render view if first name not entered', async () => {
    req.body.firstName = undefined;

    await postNewUserDetails(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/newUserDetails');
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: 'token',
      currentNavigation: 'users',
      firstName: '',
      lastName: 'Doe',
      email: 'johndoe@gmail.com',
      backLink: '/services/service1/users',
      cancelLink: '/services/service1/users',
      isDSIUser: false,
      serviceId: 'service1',
      uid: '',
      userRoles: [],
      validationMessages: {
        firstName: 'Please enter a first name',
      },
    });
  });

  it('then it should render view if last name not entered', async () => {
    req.body.lastName = undefined;

    await postNewUserDetails(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/newUserDetails');
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: 'token',
      currentNavigation: 'users',
      firstName: 'John',
      lastName: '',
      email: 'johndoe@gmail.com',
      backLink: '/services/service1/users',
      cancelLink: '/services/service1/users',
      isDSIUser: false,
      serviceId: 'service1',
      uid: '',
      userRoles: [],
      validationMessages: {
        lastName: 'Please enter a last name',
      },
    });
  });

  it('then it should render view if email not entered', async () => {
    req.body.email = undefined;

    await postNewUserDetails(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/newUserDetails');
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: 'token',
      currentNavigation: 'users',
      firstName: 'John',
      lastName: 'Doe',
      email: '',
      backLink: '/services/service1/users',
      cancelLink: '/services/service1/users',
      isDSIUser: false,
      serviceId: 'service1',
      uid: '',
      userRoles: [],
      validationMessages: {
        email: 'Please enter an email address',
      },
    });
  });

  it('then it should render view if email not a valid email address', async () => {
    req.body.email = 'not-an-email';

    await postNewUserDetails(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/newUserDetails');
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: 'token',
      currentNavigation: 'users',
      firstName: 'John',
      lastName: 'Doe',
      email: 'not-an-email',
      backLink: '/services/service1/users',
      cancelLink: '/services/service1/users',
      isDSIUser: false,
      serviceId: 'service1',
      uid: '',
      userRoles: [],
      validationMessages: {
        email: 'Please enter a valid email address',
      },
    });
  });

  it('then it should redirect to select org if existing user', async () => {
    getUserById.mockReturnValue({
        sub: 'user1',
    });

    await postNewUserDetails(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`user1/select-organisation`);
  });

  it('then it should redirect to select org if existing inv', async () => {
    getInvitationByEmail.mockReturnValue({
      id: 'user1',
    });

    await postNewUserDetails(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`inv-user1/select-organisation`);
  });

  it('then it should redirect to associate org if not existing user or inv', async () => {

    await postNewUserDetails(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`associate-organisation`);
  });


});
