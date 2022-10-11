jest.mock('./../../../src/infrastructure/config', () => require('../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/applications');

const { getRequestMock, getResponseMock } = require('../../utils');
const { getServiceSecrets } = require('../../../src/app/services/serviceSecrets');
const { getServiceById } = require('../../../src/infrastructure/applications');

const res = getResponseMock();

describe('when getting the `Manage service secrets` page', () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: 'serviceid',
      },
      userServices: {
        roles: [{
          code: 'serviceid_secretsManage',
        }],
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
          'authorization_code',
        ],
        response_types: [
          'code',
        ],
      },
    });
    res.mockResetAll();
  });

  it('then it should display the serviceSecrets view', async () => {
    await getServiceSecrets(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/serviceSecrets');
  });

  it('then it should get the service details by id', async () => {
    await getServiceSecrets(req, res);

    expect(getServiceById.mock.calls).toHaveLength(1);
    expect(getServiceById.mock.calls[0][0]).toBe('serviceid');
    expect(getServiceById.mock.calls[0][1]).toBe('correlationId');
  });

  it('then it should include csrf token in the model', async () => {
    await getServiceSecrets(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('then it should include the service name, API secret and Client secret in the model', async () => {
    await getServiceSecrets(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      service: {
        name: 'service one',
        clientSecret: 'dewier-thrombi-confounder-mikado',
        apiSecret: 'dewier-thrombi-confounder-mikado',
      },
    });
  });
});
