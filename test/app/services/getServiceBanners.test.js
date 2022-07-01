jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/applications');

const { getRequestMock, getResponseMock } = require('./../../utils');
const getServiceBanners = require('./../../../src/app/services/serviceBanners').get;
const { listBannersForService, getServiceById } = require('./../../../src/infrastructure/applications');
const res = getResponseMock();

describe('when getting the list of service banners page', () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: 'service1'
      },
      query: {
        page: 1
      },
      userServices: {
        roles: [{
          code: 'serviceid_serviceconfiguration'
        }]
      },
    });

    listBannersForService.mockReset();
    listBannersForService.mockReturnValue({
      banners: [{
        serviceId: 'serviceid',
        id: 'banner1',
        name: 'service one',
        updatedAt: '01-01-2019',
        isActive: true,
      }],
    });

    getServiceById.mockReset();
    getServiceById.mockReturnValue({
      id: 'service1',
      name:'service one',
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
          'authorization_code'
        ],
        response_types: [
          'code',
        ],
      }
    });
    res.mockResetAll();
  });

  it('then it should get the services banners by service id', async () => {

    await getServiceBanners(req, res);

    expect(listBannersForService.mock.calls).toHaveLength(1);
    expect(listBannersForService.mock.calls[0][0]).toBe('service1');
    expect(listBannersForService.mock.calls[0][1]).toBe(10);
    expect(listBannersForService.mock.calls[0][2]).toBe(1);
    expect(listBannersForService.mock.calls[0][3]).toBe('correlationId');
  });

  it('then it should get the service details', async () => {

    await getServiceBanners(req, res);

    expect(getServiceById.mock.calls).toHaveLength(1);
    expect(getServiceById.mock.calls[0][0]).toBe('service1');
    expect(getServiceById.mock.calls[0][1]).toBe('correlationId');
  });

  it('then it should return the service banners view', async () => {
    await getServiceBanners(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/serviceBanners');
  });

  it('then it should include csrf token in model', async () => {
    await getServiceBanners(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('then it should include the service banners list in the model', async () => {
    await getServiceBanners(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      serviceBanners: [{
        serviceId: 'serviceid',
        id: 'banner1',
        name: 'service one',
        updatedAt: '01-01-2019',
        isActive: true,
      }]
    });
  });

  it('then it should include the service in the model', async () => {
    await getServiceBanners(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      serviceDetails: {
        id: 'service1',
        name:'service one',
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
            'authorization_code'
          ],
          response_types: [
            'code',
          ],
        }
      }
    });
  });

});
