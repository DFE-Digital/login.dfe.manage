jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/infrastructure/organisations");
jest.mock("login.dfe.api-client/services", () => ({
  getServiceRaw: jest.fn(),
}));
jest.mock("login.dfe.api-client/organisations");

const { getRequestMock, getResponseMock } = require("../../utils");
const {
  searchOrganisationsRaw,
  searchOrganisationsAssociatedWithServiceRaw,
} = require("login.dfe.api-client/organisations");
const search = require("../../../src/app/services/organisationsSearch");

const res = getResponseMock();

const orgsResult = {
  organisations: [
    { id: "org-1", name: "organisation one" },
    { id: "org-2", name: "organisation two" },
  ],
  totalNumberOfPages: 10,
  totalNumberOfResults: 99,
};

describe("when searching for all organisations", () => {
  beforeEach(() => {
    searchOrganisationsRaw.mockReset().mockReturnValue(orgsResult);
  });

  [
    { method: "POST", dataLocation: "body", action: search.post },
    { method: "GET", dataLocation: "query", action: search.get },
  ].forEach(({ method, dataLocation, action }) => {
    it(`then it should send page of all organisations (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        userServices: {
          roles: [
            {
              code: "serviceid_serviceconfiguration",
            },
          ],
        },
      });
      req[dataLocation] = {
        criteria: "org1",
        page: 2,
      };

      await action(req, res);
      if (method === "POST") {
        expect(res.redirect.mock.calls.length).toBe(1);
        expect(res.redirect.mock.calls[0][0]).toBe(
          "?page=2&showOrganisations=all&criteria=org1&sort=name&sortDir=asc&showFilters=false",
        );
      } else if (method === "GET") {
        expect(res.render.mock.calls.length).toBe(1);
        expect(res.render.mock.calls[0][0]).toBe(
          "services/views/organisationsSearch",
        );
      }
    });

    it(`then it should search all orgs with criteria specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        userServices: {
          roles: [
            {
              code: "serviceid_serviceconfiguration",
            },
          ],
        },
      });
      req[dataLocation] = {
        criteria: "org1",
        page: 2,
      };

      await action(req, res);

      expect(searchOrganisationsRaw).toHaveBeenCalledTimes(1);
      expect(searchOrganisationsRaw).toHaveBeenCalledWith({
        organisationName: "org1",
        categories: [],
        pageNumber: 2,
        sortBy: "name",
        sortDirection: "asc",
        status: [],
      });
    });

    it(`then it should search for all orgs with no criteria if none specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        userServices: {
          roles: [
            {
              code: "serviceid_serviceconfiguration",
            },
          ],
        },
      });
      req[dataLocation] = {
        criteria: undefined,
        page: 2,
      };

      await action(req, res);

      expect(searchOrganisationsRaw).toHaveBeenCalledTimes(1);
      expect(searchOrganisationsRaw).toHaveBeenCalledWith({
        organisationName: "",
        categories: [],
        pageNumber: 2,
        sortBy: "name",
        sortDirection: "asc",
        status: [],
      });
    });

    it(`then it should request page 1 if no page specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        userServices: {
          roles: [
            {
              code: "serviceid_serviceconfiguration",
            },
          ],
        },
      });
      req[dataLocation] = {
        criteria: "org1",
        page: undefined,
      };

      await action(req, res);

      expect(searchOrganisationsRaw).toHaveBeenCalledTimes(1);
      expect(searchOrganisationsRaw).toHaveBeenCalledWith({
        organisationName: "org1",
        categories: [],
        pageNumber: 1,
        sortBy: "name",
        sortDirection: "asc",
        status: [],
      });
    });
  });
});

describe("when searching for organisations associated to current service", () => {
  beforeEach(() => {
    searchOrganisationsAssociatedWithServiceRaw
      .mockReset()
      .mockReturnValue(orgsResult);
  });

  [
    { method: "POST", dataLocation: "body", action: search.post },
    { method: "GET", dataLocation: "query", action: search.get },
  ].forEach(({ method, dataLocation, action }) => {
    it(`then it should send page of all organisations associated to current service (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        userServices: {
          roles: [
            {
              code: "serviceid_serviceconfiguration",
            },
          ],
        },
      });
      req[dataLocation] = {
        criteria: "org1",
        page: 2,
        showOrganisations: "currentService",
      };

      await action(req, res);
      if (method === "POST") {
        expect(res.redirect.mock.calls.length).toBe(1);
        expect(res.redirect.mock.calls[0][0]).toBe(
          "?page=2&showOrganisations=currentService&criteria=org1&sort=name&sortDir=asc&showFilters=false",
        );
      } else if (method === "GET") {
        expect(res.render.mock.calls.length).toBe(1);
        expect(res.render.mock.calls[0][0]).toBe(
          "services/views/organisationsSearch",
        );
      }
    });

    it(`then it should search orgs associated to current service and with criteria specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          sid: "serviceId",
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
        criteria: "org1",
        page: 2,
        showOrganisations: "currentService",
      };

      await action(req, res);

      expect(searchOrganisationsAssociatedWithServiceRaw).toHaveBeenCalledTimes(
        1,
      );
      expect(searchOrganisationsAssociatedWithServiceRaw).toHaveBeenCalledWith({
        serviceId: "serviceId",
        organisationName: "org1",
        pageNumber: 2,
        categories: [],
        status: [],
        sortBy: "name",
        sortDirection: "asc",
      });
    });

    it(`then it should search for orgs associated to current service and with no criteria if none specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          sid: "serviceId",
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
        criteria: undefined,
        page: 2,
        showOrganisations: "currentService",
      };

      await action(req, res);

      expect(searchOrganisationsAssociatedWithServiceRaw).toHaveBeenCalledTimes(
        1,
      );
      expect(searchOrganisationsAssociatedWithServiceRaw).toHaveBeenCalledWith({
        serviceId: "serviceId",
        organisationName: "",
        pageNumber: 2,
        categories: [],
        status: [],
        sortBy: "name",
        sortDirection: "asc",
      });
    });

    it(`then it should request page 1 if no page specified (${method} / ${dataLocation})`, async () => {
      const req = getRequestMock({
        method,
        params: {
          sid: "serviceId",
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
        criteria: "org1",
        page: undefined,
        showOrganisations: "currentService",
      };

      await action(req, res);

      expect(searchOrganisationsAssociatedWithServiceRaw).toHaveBeenCalledTimes(
        1,
      );
      expect(searchOrganisationsAssociatedWithServiceRaw).toHaveBeenCalledWith({
        serviceId: "serviceId",
        organisationName: "org1",
        pageNumber: 1,
        categories: [],
        status: [],
        sortBy: "name",
        sortDirection: "asc",
      });
    });
  });
});
