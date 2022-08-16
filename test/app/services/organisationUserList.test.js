jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/search');

const { getOrganisationByIdV2 } = require('./../../../src/infrastructure/organisations');
const { searchForUsers } = require('./../../../src/infrastructure/search');
const { getRequestMock, getResponseMock } = require('./../../utils');
const organisationUserList = require('./../../../src/app/services/organisationUserList');

const res = getResponseMock();
const orgResult = { id: 'org-1', name: 'organisation one' };
const usersResult = {
  users: [
    {
      id: 'user-1',
      organisations: [
        {
          id: 'org-0',
          roleId: 10000,
        },
        {
          id: 'org-1',
          roleId: 1,
        },
      ],
    },
  ],
  numberOfPages: 2,
  totalNumberOfResults: 10,
};

describe('when displaying organisation users', () => {
  beforeEach(() => {
    getOrganisationByIdV2.mockReset().mockReturnValue(orgResult);

    searchForUsers.mockReset().mockReturnValue(usersResult);
  });

  [
    { method: 'POST', dataLocation: 'body', action: organisationUserList.post },
    { method: 'GET', dataLocation: 'query', action: organisationUserList.get },
  ].forEach(({ method, dataLocation, action }) => {

    it(`then it should send page of organisation users (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          id: orgResult.id,
        },
        userServices: {
          roles: [{
            code: 'serviceid_serviceconfiguration'
          }]
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
            id: 'user-1',
            organisations: [
              {
                id: 'org-0',
                roleId: 10000,
              },
              {
                id: 'org-1',
                roleId: 1,
              },
            ],
            organisation: {
              id: 'org-1',
              roleId: 1,
              role: {
                id: 1,
                description: 'End user',
              },
            },
          }
        ],
        numberOfPages: usersResult.numberOfPages,
        totalNumberOfResults: usersResult.totalNumberOfResults,
      });
    });

    it(`then it should request all users of organisation on selected page if specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          id: orgResult.id,
          sid: 'service-1',
        },
        userServices: {
          roles: [{
            code: 'serviceid_serviceconfiguration'
          }]
        },
      });
      req[dataLocation] = {
        page: 2,
      };

      await action(req, res);

      expect(searchForUsers).toHaveBeenCalledTimes(1);
      expect(searchForUsers).toHaveBeenCalledWith('*', 2, undefined, undefined, {
        organisations: ['org-1'],
        services: ['service-1'],
      });
    });

    it(`then it should request page 1 if no page specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          id: orgResult.id,
          sid: 'service-1',
        },
        userServices: {
          roles: [{
            code: 'serviceid_serviceconfiguration'
          }]
        },
      });
      req[dataLocation] = {
        page: undefined,
      };

      await action(req, res);

      expect(searchForUsers).toHaveBeenCalledTimes(1);
      expect(searchForUsers).toHaveBeenCalledWith('*', 1, undefined, undefined, {
        organisations: ['org-1'],
        services: ['service-1'],
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
          roles: [{
            code: 'serviceid_serviceconfiguration'
          }]
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
