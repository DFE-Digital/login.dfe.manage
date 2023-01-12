jest.mock('./../../../src/infrastructure/config', () => require('../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/applications');
jest.mock('../../../src/app/services/utils');

const { getRequestMock, getResponseMock } = require('../../utils');
const getServiceInfo = require('../../../src/app/services/getServiceInfo');
const { getServiceById } = require('../../../src/infrastructure/applications');
const { getUserServiceRoles } = require('../../../src/app/services/utils');

const res = getResponseMock();

describe('when getting the Service Info page', () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: 'service1',
      },
      userServices: {
        roles: [{
          code: 'serviceid_serviceconfiguration',
        }],
      },
    });

    getServiceById.mockReset();
    getServiceById.mockReturnValue({
      id: 'service1',
      name: 'service one',
      description: 'service description',
      relyingParty: {
        client_id: 'clientid',
        client_secret: 'dewier-thrombi-confounder-mikado',
        api_secret: 'dewier-thrombi-confounder-mikado',
        service_home: 'https://www.servicehome.com',
        postResetUrl: 'https://www.postreset.com',
        redirect_uris: [
          'https://www.redirect.com',
        ],
        post_logout_redirect_uris: [
          'https://www.logout.com',
        ],
        grant_types: [
          'implicit',
          'authorization_code',
        ],
        response_types: [
          'code',
        ],
      },
    });

    getUserServiceRoles.mockReset().mockReturnValue(['serviceid_serviceconfiguration']);

    res.mockResetAll();
  });

  it('then it should display the serviceInfo view', async () => {
    await getServiceInfo(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/serviceInfo');
  });

  it('then it should get the service by id', async () => {
    await getServiceInfo(req, res);

    expect(getServiceById.mock.calls).toHaveLength(1);
    expect(getServiceById.mock.calls[0][0]).toBe('service1');
    expect(getServiceById.mock.calls[0][1]).toBe('correlationId');
  });

  it('then it should get the user`s Manage roles for the service', async () => {
    await getUserServiceRoles(req);

    expect(getUserServiceRoles.mock.calls).toHaveLength(1);
    expect(getUserServiceRoles.mock.calls[0][0]).toMatchObject(req);
  });

  it('then it should include csrf token in model', async () => {
    await getServiceInfo(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('then it should include the service name and service description in the model', async () => {
    await getServiceInfo(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      service: {
        name: 'service one',
        description: 'service description',
      },
    });
  });

  it('then should include the back link in the model', async () => {
    await getServiceInfo(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: '/services/service1',
    });
  });

  it('then should include the user roles in the model', async () => {
    await getServiceInfo(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      userRoles: ['serviceid_serviceconfiguration'],
    });
  });
});
