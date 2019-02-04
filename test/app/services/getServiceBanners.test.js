jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/applications');

const { getRequestMock, getResponseMock } = require('./../../utils');
const getServiceBanners = require('./../../../src/app/services/serviceBanners').get;
const { listBannersForService } = require('./../../../src/infrastructure/applications');
const res = getResponseMock();

describe('when getting the list of service banners page', () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: 'service1'
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
    res.mockResetAll();
  });

  it('then it should get the services banners by service id', async () => {

    await getServiceBanners(req, res);

    expect(listBannersForService.mock.calls).toHaveLength(1);
    expect(listBannersForService.mock.calls[0][0]).toBe('service1');
    expect(listBannersForService.mock.calls[0][1]).toBe('correlationId');
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

});
