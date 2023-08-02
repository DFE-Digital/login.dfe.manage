const mockUtils = require('../../utils');

const mockConfig = mockUtils.configMockFactory();
const mockLogger = mockUtils.loggerMockFactory();

jest.mock('./../../../src/infrastructure/config', () => mockConfig);
jest.mock('./../../../src/infrastructure/logger', () => mockLogger);
jest.mock('./../../../src/infrastructure/applications');

const { getRequestMock, getResponseMock } = require('../../utils');
const postSelectService = require('../../../src/app/services/selectService').post;
const { getServiceSummaries } = require('../../../src/infrastructure/applications');

const res = getResponseMock();

describe('when selecting a service', () => {
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

    getServiceSummaries.mockReset();
    getServiceSummaries.mockReturnValue({
      services: [
        {
          id: 'serviceid',
          name: 'service one',
          description: 'service one description',
        },
        {
          id: 'serviceid1',
          name: 'service two',
          description: 'service two description',
        },
      ],
    });
    res.mockResetAll();
  });

  it('then it should render validation message if no selected service', async () => {
    req.body.selectedService = undefined;

    await postSelectService(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/selectService');
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: 'token',
      selectedService: undefined,
      services: [
        {
          id: 'serviceid',
          name: 'service one',
          description: 'service one description',
        },
        {
          id: 'serviceid1',
          name: 'service two',
          description: 'service two description',
        },
      ],
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
