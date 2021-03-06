jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/organisations');

const { searchOrganisations } = require('./../../../src/infrastructure/organisations');
const { getRequestMock, getResponseMock } = require('./../../utils');
const search = require('./../../../src/app/services/organisationsSearch');
const res = getResponseMock();

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
    {method: 'POST', dataLocation: 'body', action: search.post},
    {method: 'GET', dataLocation: 'query', action: search.get},
  ].forEach(({method, dataLocation, action}) => {

    it(`then it should send page of organisations (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
      });
      req[dataLocation] = {
        criteria: 'org1',
        page: 2,
      };

      await action(req, res);

      expect(res.render.mock.calls.length).toBe(1);
      expect(res.render.mock.calls[0][0]).toBe('services/views/organisationsSearch');
    });

    it(`then it should search orgs with criteria specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
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
