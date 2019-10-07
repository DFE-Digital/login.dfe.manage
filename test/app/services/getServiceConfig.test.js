jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/applications');

const { getRequestMock, getResponseMock } = require('./../../utils');
const getServiceConfig = require('./../../../src/app/services/serviceConfig').getServiceConfig;
const { getServiceById } = require('./../../../src/infrastructure/applications');
const res = getResponseMock();


describe('when getting the service config page', () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: 'service1'
      }
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

  it('then it should display the service config view', async () => {
    await getServiceConfig(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/serviceConfig');
  });

  it('then it should get the service by id', async () => {

    await getServiceConfig(req, res);

    expect(getServiceById.mock.calls).toHaveLength(1);
    expect(getServiceById.mock.calls[0][0]).toBe('service1');
    expect(getServiceById.mock.calls[0][1]).toBe('correlationId');
  });

  it('then it should include csrf token in model', async () => {
    await getServiceConfig(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('then it should include the service in the model', async () => {
    await getServiceConfig(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      service: {
        clientId: 'clientid',
        clientSecret: 'dewier-thrombi-confounder-mikado',
        description: 'service description',
        grantTypes: ['implicit', 'authorization_code'],
        postLogoutRedirectUris: [
          'https://www.logout.com'
        ],
        postResetUrl: 'https://www.postreset.com',
        redirectUris: [
          'https://www.redirect.com',
        ],
        responseTypes: ['code'],
        serviceHome: 'https://www.servicehome.com'
      }
    });
  });

});
