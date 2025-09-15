jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/infrastructure/organisations");
jest.mock("login.dfe.api-client/services");

jest.mock("login.dfe.api-client/users", () => {
  const { mapSupportUserSortByToSearchApi } = jest.requireActual(
    "login.dfe.api-client/users",
  );
  return {
    ...jest.createMockFromModule("login.dfe.api-client/users"),
    mapSupportUserSortByToSearchApi,
  };
});

const {
  getOrganisationByIdV2,
} = require("../../../src/infrastructure/organisations");
const { getRequestMock, getResponseMock } = require("../../utils");
const organisationUserList = require("../../../src/app/services/organisationUserList");

const { searchUsersRaw } = require("login.dfe.api-client/users");

const res = getResponseMock();
const orgResult = { id: "org-1", name: "organisation one" };
const usersResult = {
  users: [
    {
      id: "user-1",
      organisations: [
        {
          id: "org-0",
          roleId: 10000,
        },
        {
          id: "org-1",
          roleId: 1,
        },
      ],
    },
  ],
  numberOfPages: 2,
  totalNumberOfResults: 10,
};

describe("when displaying organisation users", () => {
  beforeEach(() => {
    getOrganisationByIdV2.mockReset().mockReturnValue(orgResult);

    searchUsersRaw.mockReset().mockReturnValue(usersResult);
  });

  [
    { method: "POST", dataLocation: "body", action: organisationUserList.post },
    { method: "GET", dataLocation: "query", action: organisationUserList.get },
  ].forEach(({ method, dataLocation, action }) => {
    it(`then it should send page of organisation users (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          id: orgResult.id,
        },
        userServices: {
          roles: [
            {
              code: "serviceid_serviceconfiguration",
            },
          ],
        },
      });
      req[dataLocation] = {
        page: 2,
      };

      await action(req, res);

      expect(res.render.mock.calls.length).toBe(1);
      expect(res.render.mock.calls[0][1]).toMatchObject({
        csrfToken: req.csrfToken(),
        organisation: orgResult,
        page: 2,
        users: [
          {
            id: "user-1",
            organisations: [
              {
                id: "org-0",
                roleId: 10000,
              },
              {
                id: "org-1",
                roleId: 1,
              },
            ],
            organisation: {
              id: "org-1",
              roleId: 1,
              role: {
                id: 0,
                description: "End user",
              },
            },
          },
        ],
        numberOfPages: usersResult.numberOfPages,
        totalNumberOfResults: usersResult.totalNumberOfResults,
      });
    });

    it(`then it should request all users of organisation on selected page if specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          oid: orgResult.id,
          sid: "service-1",
        },
        userServices: {
          roles: [
            {
              code: "serviceid_serviceconfiguration",
            },
          ],
        },
      });
      req[dataLocation] = {
        page: 2,
      };

      await action(req, res);

      expect(searchUsersRaw).toHaveBeenCalledTimes(1);
      expect(searchUsersRaw).toHaveBeenCalledWith({
        searchCriteria: "*",
        pageNumber: 2,
        sortBy: "searchableName",
        sortDirection: "asc",
        filterBy: {
          organisationIds: ["org-1"],
        },
      });
    });

    it(`then it should request page 1 if no page specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          oid: orgResult.id,
        },
        userServices: {
          roles: [
            {
              code: "serviceid_serviceconfiguration",
            },
          ],
        },
      });
      req[dataLocation] = {
        page: undefined,
      };

      await action(req, res);

      expect(searchUsersRaw).toHaveBeenCalledTimes(1);
      expect(searchUsersRaw).toHaveBeenCalledWith({
        searchCriteria: "*",
        pageNumber: 1,
        sortBy: "searchableName",
        sortDirection: "asc",
        filterBy: {
          organisationIds: ["org-1"],
        },
      });
    });

    it(`then it should request all users ordered by name and ascending order, if sorting by "Name - ascending" (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          oid: orgResult.id,
        },
        userServices: {
          roles: [
            {
              code: "serviceid_serviceconfiguration",
            },
          ],
        },
      });
      req[dataLocation] = {
        page: 3,
        sort: "name",
        sortDir: "asc",
      };

      await action(req, res);

      expect(searchUsersRaw).toHaveBeenCalledTimes(1);
      expect(searchUsersRaw).toHaveBeenCalledWith({
        searchCriteria: "*",
        pageNumber: 3,
        sortBy: "searchableName",
        sortDirection: "asc",
        filterBy: {
          organisationIds: ["org-1"],
        },
      });
    });

    it(`then it should request all users ordered by name and descending order, if sorting by "Name - descending" (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          oid: orgResult.id,
        },
        userServices: {
          roles: [
            {
              code: "serviceid_serviceconfiguration",
            },
          ],
        },
      });
      req[dataLocation] = {
        page: 3,
        sort: "name",
        sortDir: "desc",
      };

      await action(req, res);

      expect(searchUsersRaw).toHaveBeenCalledTimes(1);
      expect(searchUsersRaw).toHaveBeenCalledWith({
        searchCriteria: "*",
        pageNumber: 3,
        sortBy: "searchableName",
        sortDirection: "desc",
        filterBy: {
          organisationIds: ["org-1"],
        },
      });
    });

    it(`then it should request all users ordered by email and ascending order,if sorting by "Email - ascending" (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          oid: orgResult.id,
        },
        userServices: {
          roles: [
            {
              code: "serviceid_serviceconfiguration",
            },
          ],
        },
      });
      req[dataLocation] = {
        page: 3,
        sort: "email",
        sortDir: "asc",
      };

      await action(req, res);

      expect(searchUsersRaw).toHaveBeenCalledTimes(1);
      expect(searchUsersRaw).toHaveBeenCalledWith({
        searchCriteria: "*",
        pageNumber: 3,
        sortBy: "searchableEmail",
        sortDirection: "asc",
        filterBy: {
          organisationIds: ["org-1"],
        },
      });
    });

    it(`then it should request all users ordered by email and descending order, if sorting by "Email - descending" (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          oid: orgResult.id,
        },
        userServices: {
          roles: [
            {
              code: "serviceid_serviceconfiguration",
            },
          ],
        },
      });
      req[dataLocation] = {
        page: 3,
        sort: "email",
        sortDir: "desc",
      };

      await action(req, res);

      expect(searchUsersRaw).toHaveBeenCalledTimes(1);
      expect(searchUsersRaw).toHaveBeenCalledWith({
        searchCriteria: "*",
        pageNumber: 3,
        sortBy: "searchableEmail",
        sortDirection: "desc",
        filterBy: {
          organisationIds: ["org-1"],
        },
      });
    });

    it(`then it should request all users ordered by status and ascending order, if sorting by "Status - ascending" (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          oid: orgResult.id,
        },
        userServices: {
          roles: [
            {
              code: "serviceid_serviceconfiguration",
            },
          ],
        },
      });
      req[dataLocation] = {
        page: 3,
        sort: "status",
        sortDir: "asc",
      };

      await action(req, res);

      expect(searchUsersRaw).toHaveBeenCalledTimes(1);
      expect(searchUsersRaw).toHaveBeenCalledWith({
        searchCriteria: "*",
        pageNumber: 3,
        sortBy: "statusId",
        sortDirection: "asc",
        filterBy: {
          organisationIds: ["org-1"],
        },
      });
    });

    it(`then it should request all users ordered by status and descending order, if sorting by "Status - descending" (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          oid: orgResult.id,
        },
        userServices: {
          roles: [
            {
              code: "serviceid_serviceconfiguration",
            },
          ],
        },
      });
      req[dataLocation] = {
        page: 3,
        sort: "status",
        sortDir: "desc",
      };

      await action(req, res);

      expect(searchUsersRaw).toHaveBeenCalledTimes(1);
      expect(searchUsersRaw).toHaveBeenCalledWith({
        searchCriteria: "*",
        pageNumber: 3,
        sortBy: "statusId",
        sortDirection: "desc",
        filterBy: {
          organisationIds: ["org-1"],
        },
      });
    });

    it(`then it should request all users ordered by last login and ascending order, if sorting by "Last login - ascending" (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          oid: orgResult.id,
        },
        userServices: {
          roles: [
            {
              code: "serviceid_serviceconfiguration",
            },
          ],
        },
      });
      req[dataLocation] = {
        page: 3,
        sort: "lastlogin",
        sortDir: "asc",
      };

      await action(req, res);

      expect(searchUsersRaw).toHaveBeenCalledTimes(1);
      expect(searchUsersRaw).toHaveBeenCalledWith({
        searchCriteria: "*",
        pageNumber: 3,
        sortBy: "lastLogin",
        sortDirection: "asc",
        filterBy: {
          organisationIds: ["org-1"],
        },
      });
    });

    it(`then it should request all users ordered by last login and descending order, if sorting by "Last Login - descending" (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          oid: orgResult.id,
        },
        userServices: {
          roles: [
            {
              code: "serviceid_serviceconfiguration",
            },
          ],
        },
      });
      req[dataLocation] = {
        page: 3,
        sort: "lastlogin",
        sortDir: "desc",
      };

      await action(req, res);

      expect(searchUsersRaw).toHaveBeenCalledTimes(1);
      expect(searchUsersRaw).toHaveBeenCalledWith({
        searchCriteria: "*",
        pageNumber: 3,
        sortBy: "lastLogin",
        sortDirection: "desc",
        filterBy: {
          organisationIds: ["org-1"],
        },
      });
    });

    it(`then it should request sorting ascending by name if no sorting order and direction is specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          oid: orgResult.id,
        },
        userServices: {
          roles: [
            {
              code: "serviceid_serviceconfiguration",
            },
          ],
        },
      });
      req[dataLocation] = {
        page: 3,
      };

      await action(req, res);

      expect(searchUsersRaw).toHaveBeenCalledTimes(1);
      expect(searchUsersRaw).toHaveBeenCalledWith({
        searchCriteria: "*",
        pageNumber: 3,
        sortBy: "searchableName",
        sortDirection: "asc",
        filterBy: {
          organisationIds: ["org-1"],
        },
      });
    });

    it(`then it should request current organisation details (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          id: orgResult.id,
          oid: orgResult.id,
        },
        userServices: {
          roles: [
            {
              code: "serviceid_serviceconfiguration",
            },
          ],
        },
      });
      req[dataLocation] = {
        page: 2,
      };

      await action(req, res);

      expect(getOrganisationByIdV2).toHaveBeenCalledTimes(1);
      expect(getOrganisationByIdV2).toHaveBeenCalledWith(orgResult.id, req.id);
    });
  });
});
