jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/search');
jest.mock('./../../../src/infrastructure/applications');

const { searchForUsers } = require('./../../../src/infrastructure/search');
const { getServiceById } = require('./../../../src/infrastructure/applications');
const { getRequestMock, getResponseMock } = require('./../../utils');
const { post } = require('./../../../src/app/services/usersSearch');

describe('When posting users search ', () => {
  let req;
  let res;
  let usersSearchResult;

  beforeEach(() => {
    req = getRequestMock({
      method: 'POST',
      body: {
        criteria: 'test',
      },
      params: {
        sid: 'service1'
      },
      userServices: {
        roles: [{
          code: 'serviceid_serviceconfiguration'
        }]
      },
    });

    res = getResponseMock();

    usersSearchResult = [
      {
        name: 'Timmy Tester',
        email: 'timmy@tester.test',
        organisation: {
          name: 'Testco'
        },
        organisations:[],
        lastLogin: new Date(2018, 0, 11, 11, 30, 57),
        status: {
          description: 'Active',
        },
      },
    ];

    searchForUsers.mockReset();
    searchForUsers.mockReturnValue({
      criteria: 'test',
      page: 1,
      numberOfPages: 3,
      sortBy: 'test',
      sortOrder: 'desc',
      users: usersSearchResult
    });

    getServiceById.mockReset();
    getServiceById.mockReturnValue({
      id: 'service1',
      dateActivated: '10/10/2018',
      name: 'service name',
      status: 'active',
    });
  });

  it('then it should return the users search view', async () => {
    await post(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/usersSearch');
  });

  it('then it should include csrf token', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('then it should include criteria', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      criteria: 'test',
    });
  });

  it('then it includes the sort order and sort value', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      sortBy: 'name',
      sortOrder: 'asc'
    });
  });

  it('then it should include page details', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      page: 1,
      numberOfPages: 3,
    });
  });

  it('then it should include users', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      users: usersSearchResult,
    });
  });
});
