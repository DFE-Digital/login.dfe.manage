jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());

const { getRequestMock, getResponseMock } = require('./../../utils');
const res = getResponseMock();
const getNewUserDetails = require('./../../../src/app/services/newUserDetails').get;

describe('when displaying the user details view', () => {

  let req;

  beforeEach(() => {
    req = getRequestMock();
  });

  it('then it should return the user details view', async () => {
    await getNewUserDetails(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/newUserDetails');
  });

  it('then it should include csrf token', async () => {
    await getNewUserDetails(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('then it should include first name', async () => {
    await getNewUserDetails(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      firstName: '',
    });
  });

  it('then it should include last name', async () => {
    await getNewUserDetails(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      lastName: '',
    });
  });

  it('then it should include email', async () => {
    await getNewUserDetails(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      email: '',
    });
  });
});
