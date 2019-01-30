jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/applications');

const { getRequestMock, getResponseMock } = require('./../../utils');
const postSelectService = require('./../../../src/app/services/selectService').post;
const { getServiceById } = require('./../../../src/infrastructure/applications');
const res = getResponseMock();

describe('when selecting a service', () => {
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

  it('then it should render validation message if no selected service', async () => {
    req.body.selectedService = undefined;

    await postSelectService(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe(`services/views/selectService`);
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: 'token',
      selectedService: undefined,
      services: [{
        id: 'serviceid',
        name: 'service one'
      }],
      title: 'Select service',
      validationMessages: {
        selectedService: 'Please select a service',
      },
    });
  });

  it('then it should redirect to the selected organisation if not undefined', async () => {
    req.body.selectedService = 'service1';
    await postSelectService(req, res);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`/services/${req.body.selectedService}`);
  });
});
