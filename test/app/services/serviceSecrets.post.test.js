jest.mock('./../../../src/infrastructure/config', () => require('../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/applications');

const { getRequestMock, getResponseMock } = require('../../utils');
const { postServiceSecrets } = require('../../../src/app/services/serviceSecrets');
const { getServiceById, updateService } = require('../../../src/infrastructure/applications');
const logger = require('../../../src/infrastructure/logger');

const res = getResponseMock();

describe('when updating the service secret details', () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      body: {
        clientSecret: 'outshine-wringing-imparting-submitted',
        apiSecret: 'outshine-wringing-imparting-submitted',
      },
      params: {
        sid: 'service1',
      },
    });

    updateService.mockReset();
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
    res.mockResetAll();
  });

  it('then it should render view with validation if API secret not entered', async () => {
    req.body.apiSecret = undefined;

    await postServiceSecrets(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/serviceSecrets');
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: '/services/service1',
      csrfToken: 'token',
      currentNavigation: 'configuration',
      service: {
        clientSecret: 'outshine-wringing-imparting-submitted',
        apiSecret: undefined,
        name: 'service one',
      },
      serviceId: 'service1',
      userRoles: [],
      validationMessages: {
        apiSecret: 'Invalid API secret',
      },
    });
  });

  it('then it should render view with validation if API secret is an empty string', async () => {
    req.body.apiSecret = '';

    await postServiceSecrets(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/serviceSecrets');
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: '/services/service1',
      csrfToken: 'token',
      currentNavigation: 'configuration',
      service: {
        clientSecret: 'outshine-wringing-imparting-submitted',
        apiSecret: '',
        name: 'service one',
      },
      serviceId: 'service1',
      userRoles: [],
      validationMessages: {
        apiSecret: 'Invalid API secret',
      },
    });
  });

  it('then it should render view with validation if API secret is not a 8-byte passphrase', async () => {
    req.body.apiSecret = 'test-this';

    await postServiceSecrets(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/serviceSecrets');
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: '/services/service1',
      csrfToken: 'token',
      currentNavigation: 'configuration',
      service: {
        clientSecret: 'outshine-wringing-imparting-submitted',
        apiSecret: 'test-this',
        name: 'service one',
      },
      serviceId: 'service1',
      userRoles: [],
      validationMessages: {
        apiSecret: 'Invalid API secret',
      },
    });
  });

  it('then it should render view with validation if client secret not entered', async () => {
    req.body.clientSecret = undefined;

    await postServiceSecrets(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/serviceSecrets');
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: '/services/service1',
      csrfToken: 'token',
      currentNavigation: 'configuration',
      service: {
        apiSecret: 'outshine-wringing-imparting-submitted',
        clientSecret: '',
        name: 'service one',
      },
      serviceId: 'service1',
      userRoles: [],
      validationMessages: {
        clientSecret: 'Invalid client secret',
      },
    });
  });

  it('then it should render view with validation if client secret is an empty string', async () => {
    req.body.clientSecret = '';

    await postServiceSecrets(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/serviceSecrets');
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: '/services/service1',
      csrfToken: 'token',
      currentNavigation: 'configuration',
      service: {
        apiSecret: 'outshine-wringing-imparting-submitted',
        clientSecret: '',
        name: 'service one',
      },
      serviceId: 'service1',
      userRoles: [],
      validationMessages: {
        clientSecret: 'Invalid client secret',
      },
    });
  });

  it('then it should render view with validation if client secret is not a 8-byte passphrase', async () => {
    req.body.clientSecret = 'test-this';

    await postServiceSecrets(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/serviceSecrets');
    expect(res.render.mock.calls[0][1]).toEqual({
      backLink: '/services/service1',
      csrfToken: 'token',
      currentNavigation: 'configuration',
      service: {
        apiSecret: 'outshine-wringing-imparting-submitted',
        clientSecret: 'test-this',
        name: 'service one',
      },
      serviceId: 'service1',
      userRoles: [],
      validationMessages: {
        clientSecret: 'Invalid client secret',
      },
    });
  });

  it('then it should update the service', async () => {
    await postServiceSecrets(req, res);

    expect(updateService.mock.calls).toHaveLength(1);
    expect(updateService.mock.calls[0][0]).toBe('service1');

    expect(updateService.mock.calls[0][1]).toEqual({
      clientSecret: 'outshine-wringing-imparting-submitted',
      apiSecret: 'outshine-wringing-imparting-submitted',
    });
    expect(updateService.mock.calls[0][2]).toBe('correlationId');
  });

  it('then it should audit service secret details being updated', async () => {
    await postServiceSecrets(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe('user@unit.test (id: user1) updated service secret details for service service one (id: service1)');
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: 'manage',
      subType: 'service-secret-details-updated',
      userId: 'user1',
      userEmail: 'user@unit.test',
      editedService: 'service1',
    });
  });

  it('then it should redirect to the Dashboard page', async () => {
    await postServiceSecrets(req, res);
    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith('/services/service1');
  });

  it('then a success banner is displayed', async () => {
    await postServiceSecrets(req, res);

    expect(res.flash.mock.calls).toHaveLength(3);
    expect(res.flash.mock.calls[0][0]).toBe('title');
    expect(res.flash.mock.calls[0][1]).toBe('Success');
    expect(res.flash.mock.calls[1][0]).toBe('heading');
    expect(res.flash.mock.calls[1][1]).toBe('Service secret details have been updated');
    expect(res.flash.mock.calls[2][0]).toBe('message');
    expect(res.flash.mock.calls[2][1]).toBe('Your service secret details update has been successfully saved.');
  });
});
