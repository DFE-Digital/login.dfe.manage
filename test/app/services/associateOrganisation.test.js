jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('login.dfe.policy-engine');

const { getRequestMock, getResponseMock } = require('./../../utils');
const res = getResponseMock();
const associateOrg = require('./../../../src/app/services/associateOrganisation');
const { searchOrganisations } = require('./../../../src/infrastructure/organisations');

const orgsResult = {
  organisations: [
    { id: 'org-1', name: 'organisation one'},
    { id: 'org-2', name: 'organisation two'},
  ],
  totalNumberOfPages: 10,
  totalNumberOfResults: 99,
};

describe('when searching for organisations', () => {
  beforeEach(() => {
    searchOrganisations.mockReset().mockReturnValue(orgsResult);
  });

  [
    {method: 'POST', dataLocation: 'body', action: associateOrg.post},
    {method: 'GET', dataLocation: 'query', action: associateOrg.get},
  ].forEach(({method, dataLocation, action}) => {

    it(`then it should send page of organisations (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        session: {
          user: {
            firstName: 'John',
            lastName: 'Doe',
          }
        }
      });
      req[dataLocation] = {
        criteria: 'org1',
        page: 2,
      };

      await action(req, res);

      expect(res.render.mock.calls.length).toBe(1);
      expect(res.render.mock.calls[0][0]).toBe('services/views/associateOrganisation');
    });

    it(`then it should search orgs with criteria specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        session: {
          user: {
            firstName: 'John',
            lastName: 'Doe',
          }
        }
      });
      req[dataLocation] = {
        criteria: 'org1',
        page: 2,
      };

      await action(req, res);

      expect(searchOrganisations).toHaveBeenCalledTimes(1);
      expect(searchOrganisations).toHaveBeenCalledWith('org1', undefined, 2, req.id);
    });

    it(`then it should search orgs with no criteria if none specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        session: {
          user: {
            firstName: 'John',
            lastName: 'Doe',
          }
        }
      });
      req[dataLocation] = {
        criteria: undefined,
        page: 2,
      };

      await action(req, res);

      expect(searchOrganisations).toHaveBeenCalledTimes(1);
      expect(searchOrganisations).toHaveBeenCalledWith('', undefined, 2, req.id);
    });

    it(`then it should request page 1 if no page specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        session: {
          user: {
            firstName: 'John',
            lastName: 'Doe',
          }
        }
      });
      req[dataLocation] = {
        criteria: 'org1',
        page: undefined,
      };

      await action(req, res);

      expect(searchOrganisations).toHaveBeenCalledTimes(1);
      expect(searchOrganisations).toHaveBeenCalledWith('org1', undefined, 1, req.id);
    });
  });

});
