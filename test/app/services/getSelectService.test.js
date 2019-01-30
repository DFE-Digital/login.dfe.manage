jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/applications');

const { getRequestMock, getResponseMock } = require('./../../utils');
const getSelectService = require('./../../../src/app/services/selectService').get;
const { getServiceById } = require('./../../../src/infrastructure/applications');
const res = getResponseMock();

describe('when getting the select service page', () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: 'service1'
      },
      userServices: {
        roles: [{
          code: 'serviceid_serviceconfiguration'
        }]
      },
    });

    getServiceById.mockReset();
    getServiceById.mockReturnValue({
      id: 'serviceid',
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
          'authorization_code'
        ],
        response_types: [
          'code',
        ],
      }
    });
    res.mockResetAll();
  });
  it('then it should get the service by id', async () => {

    await getSelectService(req, res);

    expect(getServiceById.mock.calls).toHaveLength(1);
    expect(getServiceById.mock.calls[0][0]).toBe('serviceid');
    expect(getServiceById.mock.calls[0][1]).toBe('correlationId');
  });

  it('then it should return the multiple services view', async () => {
    await getSelectService(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/selectService');
  });

  it('then it should include csrf token in model', async () => {
    await getSelectService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('then it should include the service details in the model', async () => {
    await getSelectService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      services: [{
        id: 'serviceid',
        name: 'service one'
      }]
    });
  });
});
