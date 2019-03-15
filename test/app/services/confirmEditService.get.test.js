jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/app/services/utils');
jest.mock('./../../../src/infrastructure/access', () => {
  return {
    listRolesOfService: jest.fn(),
  };
});
jest.mock('./../../../src/infrastructure/applications', () => {
  return {
    getServiceById: jest.fn(),
  };
});
jest.mock('./../../../src/infrastructure/organisations', () => {
  return {
    getOrganisationByIdV2: jest.fn(),
  };
});

const { getRequestMock, getResponseMock } = require('./../../utils');
const { listRolesOfService } = require('./../../../src/infrastructure/access');
const { getOrganisationByIdV2 } = require('./../../../src/infrastructure/organisations');
const { getUserDetails } = require('./../../../src/app/services/utils');
const { getServiceById } = require('./../../../src/infrastructure/applications');
const res = getResponseMock();

describe('when displaying the confirm edit service view', () => {

  let req;

  let getConfirmEditService;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: 'user1',
        oid: 'org1',
        sid: 'service1',
      },
      session: {
        service: {
          roles: ['role_id']
        },
      },
    });

    getServiceById.mockReset();
    getServiceById.mockReturnValue({
      id: 'service1',
      dateActivated: '10/10/2018',
      name: 'service name',
      status: 'active',
    });

    listRolesOfService.mockReset();
    listRolesOfService.mockReturnValue([{
      code: 'role_code',
      id: 'role_id',
      name: 'role_name',
      status: {
        id: 'status_id'
      },
    }]);

    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: 'user1',
    });

    getOrganisationByIdV2.mockReset();
    getOrganisationByIdV2.mockReturnValue({
      id: 'org1',
      name: 'org name',
    });
    getConfirmEditService = require('./../../../src/app/services/confirmEditService').get;
  });

  it('then it should get the service details by id', async () => {
    await getConfirmEditService(req, res);

    expect(getServiceById.mock.calls).toHaveLength(1);
    expect(getServiceById.mock.calls[0][0]).toBe('service1');
    expect(getServiceById.mock.calls[0][1]).toBe('correlationId');
  });

  it('then it should get the selected roles details', async () => {
    await getConfirmEditService(req, res);

    expect(listRolesOfService.mock.calls).toHaveLength(1);
    expect(listRolesOfService.mock.calls[0][0]).toBe('service1');
    expect(listRolesOfService.mock.calls[0][1]).toBe('correlationId');
  });

  it('then it should get the org details', async () => {
    await getConfirmEditService(req, res);

    expect(getOrganisationByIdV2.mock.calls).toHaveLength(1);
    expect(getOrganisationByIdV2.mock.calls[0][0]).toBe('org1');
    expect(getOrganisationByIdV2.mock.calls[0][1]).toBe('correlationId');
  });

  it('then it should return the confirm edit services view', async () => {
    await getConfirmEditService(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/confirmEditService');
  });

  it('then it should include csrf token', async () => {
    await getConfirmEditService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('then it should include the organisation details', async () => {
    await getConfirmEditService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      organisation: {
        id: 'org1',
        name: 'org name',
      },
    });
  });

  it('then it should include the service details', async () => {
    await getConfirmEditService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      service: {
        id: 'service1',
        dateActivated: '10/10/2018',
        name: 'service name',
        status: 'active',
      },
    });
  });

  it('then it should include the roles', async () => {
    await getConfirmEditService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      roles: [{
        code: 'role_code',
        id: 'role_id',
        name: 'role_name',
        status: {
          id: 'status_id',
        },
      }],
    });
  });
});
