jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/infrastructure/search");
jest.mock("login.dfe.api-client/services", () => ({
  getServiceRaw: jest.fn(),
}));

const { searchForUsers } = require("./../../../src/infrastructure/search");
const { getRequestMock, getResponseMock } = require("./../../utils");
const { post } = require("./../../../src/app/services/usersSearch");
const { getServiceRaw } = require("login.dfe.api-client/services");

describe("When posting users search ", () => {
  let req;
  let res;
  let usersSearchResult;

  beforeEach(() => {
    req = getRequestMock({
      method: "POST",
      body: {
        criteria: "test",
      },
      params: {
        sid: "service1",
      },
      userServices: {
        roles: [
          {
            code: "serviceid_serviceconfiguration",
          },
        ],
      },
    });

    res = getResponseMock();

    usersSearchResult = [
      {
        name: "Timmy Tester",
        email: "timmy@tester.test",
        organisation: {
          name: "Testco",
        },
        organisations: [],
        lastLogin: new Date(2018, 0, 11, 11, 30, 57),
        status: {
          description: "Active",
        },
      },
    ];

    searchForUsers.mockReset();
    searchForUsers.mockReturnValue({
      criteria: "test",
      page: 1,
      numberOfPages: 3,
      sortBy: "test",
      sortOrder: "desc",
      users: usersSearchResult,
    });

    getServiceRaw.mockReset();
    getServiceRaw.mockReturnValue({
      id: "service1",
      dateActivated: "10/10/2018",
      name: "service name",
      status: "active",
    });
  });

  it("then it should be the redirected to get view with query parameter: page", async () => {
    await post(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toMatch(/(^\?|&)page=\d+(&|$)/);
  });

  it("then it should be the redirected to get view with query parameter: criteria", async () => {
    await post(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toMatch(/(^\?|&)criteria=.*(&|$)/);
  });

  it("then it should be the redirected to get view with query parameter: sort", async () => {
    await post(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toMatch(/(^\?|&)sort=.+(&|$)/);
  });

  it("then it should be the redirected to get view with query parameter: sortDir", async () => {
    await post(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toMatch(
      /(^\?|&)sortDir=(asc|desc)(&|$)/,
    );
  });

  it("then it should be the redirected to get view with query parameter: showServices", async () => {
    await post(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toMatch(
      /(^\?|&)showServices=(all|current)(&|$)/,
    );
  });
});
