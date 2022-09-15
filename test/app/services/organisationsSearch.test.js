jest.mock('./../../../src/infrastructure/config', () => require('../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/organisations');

const { searchOrganisations, searchOrgsAssociatedWithService } = require('../../../src/infrastructure/organisations');
const { getRequestMock, getResponseMock } = require('../../utils');
const search = require('../../../src/app/services/organisationsSearch');

const res = getResponseMock();

const orgsResult = {
  organisations: [
    { id: 'org-1', name: 'organisation one' },
    { id: 'org-2', name: 'organisation two' },
  ],
  totalNumberOfPages: 10,
  totalNumberOfResults: 99,
};

describe('when searching for all organisations', () => {
  beforeEach(() => {
    searchOrganisations.mockReset().mockReturnValue(orgsResult);
  });

  [
    { method: 'POST', dataLocation: 'body', action: search.post },
    { method: 'GET', dataLocation: 'query', action: search.get },
  ].forEach(({ method, dataLocation, action }) => {
    it(`then it should send page of all organisations (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        userServices: {
          roles: [{
            code: 'serviceid_serviceconfiguration',
          }],
        },
      });
      req[dataLocation] = {
        criteria: 'org1',
        page: 2,
      };

      await action(req, res);
      if (method === 'POST') {
        expect(res.redirect.mock.calls.length).toBe(1);
        expect(res.redirect.mock.calls[0][0]).toBe('?page=2&showOrganisations=all&criteria=org1&sort=name&sortDir=asc');
      } else if (method === 'GET') {
        expect(res.render.mock.calls.length).toBe(1);
        expect(res.render.mock.calls[0][0]).toBe('services/views/organisationsSearch');
      }
    });

    it(`then it should search all orgs with criteria specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        userServices: {
          roles: [{
            code: 'serviceid_serviceconfiguration',
          }],
        },
      });
      req[dataLocation] = {
        criteria: 'org1',
        page: 2,
      };

      await action(req, res);

      expect(searchOrganisations).toHaveBeenCalledTimes(1);
      expect(searchOrganisations).toHaveBeenCalledWith('org1', undefined, 2, 'name', 'asc', req.id);
    });

    it(`then it should search for all orgs with no criteria if none specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        userServices: {
          roles: [{
            code: 'serviceid_serviceconfiguration',
          }],
        },
      });
      req[dataLocation] = {
        criteria: undefined,
        page: 2,
      };

      await action(req, res);

      expect(searchOrganisations).toHaveBeenCalledTimes(1);
      expect(searchOrganisations).toHaveBeenCalledWith('', undefined, 2, 'name', 'asc', req.id);
    });

    it(`then it should request page 1 if no page specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        userServices: {
          roles: [{
            code: 'serviceid_serviceconfiguration',
          }],
        },
      });
      req[dataLocation] = {
        criteria: 'org1',
        page: undefined,
      };

      await action(req, res);

      expect(searchOrganisations).toHaveBeenCalledTimes(1);
      expect(searchOrganisations).toHaveBeenCalledWith('org1', undefined, 1, 'name', 'asc', req.id);
    });
  });
});

describe('when searching for organisations associated to current service', () => {
  beforeEach(() => {
    searchOrgsAssociatedWithService.mockReset().mockReturnValue(orgsResult);
  });

  [
    { method: 'POST', dataLocation: 'body', action: search.post },
    { method: 'GET', dataLocation: 'query', action: search.get },
  ].forEach(({ method, dataLocation, action }) => {
    it(`then it should send page of all organisations associated to current service (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        userServices: {
          roles: [{
            code: 'serviceid_serviceconfiguration',
          }],
        },
      });
      req[dataLocation] = {
        criteria: 'org1',
        page: 2,
        showOrganisations: 'currentService',
      };

      await action(req, res);
      if (method === 'POST') {
        expect(res.redirect.mock.calls.length).toBe(1);
        expect(res.redirect.mock.calls[0][0]).toBe('?page=2&showOrganisations=currentService&criteria=org1&sort=name&sortDir=asc');
      } else if (method === 'GET') {
        expect(res.render.mock.calls.length).toBe(1);
        expect(res.render.mock.calls[0][0]).toBe('services/views/organisationsSearch');
      }
    });

    it(`then it should search orgs associated to current service and with criteria specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          sid: 'serviceId',
        },
        userServices: {
          roles: [{
            code: 'serviceid_serviceconfiguration',
          }],
        },
      });
      req[dataLocation] = {
        criteria: 'org1',
        page: 2,
        showOrganisations: 'currentService',
      };

      await action(req, res);

      expect(searchOrgsAssociatedWithService).toHaveBeenCalledTimes(1);
      expect(searchOrgsAssociatedWithService).toHaveBeenCalledWith('serviceId', 'org1', 2, 'name', 'asc', 'correlationId');
    });

    it(`then it should search for orgs associated to current service and with no criteria if none specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          sid: 'serviceId',
        },
        userServices: {
          roles: [{
            code: 'serviceid_serviceconfiguration',
          }],
        },
      });
      req[dataLocation] = {
        criteria: undefined,
        page: 2,
        showOrganisations: 'currentService',
      };

      await action(req, res);

      expect(searchOrgsAssociatedWithService).toHaveBeenCalledTimes(1);
      expect(searchOrgsAssociatedWithService).toHaveBeenCalledWith('serviceId', '', 2, 'name', 'asc', 'correlationId');
    });

    it(`then it should request page 1 if no page specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          sid: 'serviceId',
        },
        userServices: {
          roles: [{
            code: 'serviceid_serviceconfiguration',
          }],
        },
      });
      req[dataLocation] = {
        criteria: 'org1',
        page: undefined,
        showOrganisations: 'currentService',
      };

      await action(req, res);

      expect(searchOrgsAssociatedWithService).toHaveBeenCalledTimes(1);
      expect(searchOrgsAssociatedWithService).toHaveBeenCalledWith('serviceId', 'org1', 1, 'name', 'asc', req.id);
    });
  });
});
