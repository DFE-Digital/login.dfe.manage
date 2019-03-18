jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/applications');
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/app/services/utils');

const { getRequestMock, getResponseMock } = require('./../../utils');
const { getUserDetails } = require('./../../../src/app/services/utils');
const { getOrganisationByIdV2 } = require('./../../../src/infrastructure/organisations');
const { getServiceById } = require('./../../../src/infrastructure/applications');
const res = getResponseMock();

describe('when displaying the remove service access view', () => {
  let req;

  let getRemoveService;

  beforeEach(() => {
    req = getRequestMock();
    req.params = {
      uid: 'user1',
      oid: 'org1',
      sid: 'service1',
    };

    getServiceById.mockReset();
    getServiceById.mockReturnValue({
      id: 'service1',
      dateActivated: '10/10/2018',
      name: 'service name',
      status: 'active',
    });
    getOrganisationByIdV2.mockReset();
    getOrganisationByIdV2.mockReturnValue({
      id: 'org-1',
      name: 'organisation one'
    });
    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: 'user1',
    });
    getRemoveService = require('./../../../src/app/services/removeService').get;
  });

  it('then it should get the selected user service', async () => {
    await getRemoveService(req, res);

    expect(getServiceById.mock.calls).toHaveLength(1);
    expect(getServiceById.mock.calls[0][0]).toBe('service1');
    expect(getServiceById.mock.calls[0][1]).toBe('correlationId');
  });

  it('then it should get the organisation details', async () => {
    await getRemoveService(req, res);

    expect(getOrganisationByIdV2.mock.calls).toHaveLength(1);
    expect(getOrganisationByIdV2.mock.calls[0][0]).toBe('org1');
    expect(getOrganisationByIdV2.mock.calls[0][1]).toBe('correlationId');
  });

  it('then it should return the confirm remove service view', async () => {
    await getRemoveService(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/removeService');
  });

  it('then it should include csrf token', async () => {
    await getRemoveService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('then it should include the service details', async () => {
    await getRemoveService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      service: {
        id: 'service1',
        dateActivated: '10/10/2018',
        name: 'service name',
        status: 'active',
      },
    });
  });

  it('then it should include the org details', async () => {
    await getRemoveService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      organisation: {
        id: 'org-1',
        name: 'organisation one'
      },
    });
  });
});
