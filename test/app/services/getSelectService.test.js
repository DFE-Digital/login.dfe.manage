const mockUtils = require('../../utils');

const mockConfig = mockUtils.configMockFactory();
const mockLogger = mockUtils.loggerMockFactory();

jest.mock('./../../../src/infrastructure/config', () => mockConfig);
jest.mock('./../../../src/infrastructure/logger', () => mockLogger);
jest.mock('./../../../src/infrastructure/applications');

const { getRequestMock, getResponseMock } = require('../../utils');
const getSelectService = require('../../../src/app/services/selectService').get;
const { getServiceById } = require('../../../src/infrastructure/applications');

const res = getResponseMock();

describe('When going to the select-service page', () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      userServices: {
        roles: [
          {
            code: 'serviceid_serviceconfig',
          },
          {
            code: 'serviceid1_serviceconfig',
          },
        ],
      },
    });

    getServiceById.mockReset();
    getServiceById.mockReturnValue([{
      id: 'serviceid',
      name: 'service one',
      description: 'service one description',
    }], [{
      id: 'serviceid1',
      name: 'service two',
      description: 'service two description',
    }]);
    res.mockResetAll();
  });

  it('then it should get the services by id', async () => {
    await getSelectService(req, res);

    expect(getServiceById.mock.calls).toHaveLength(2);
    expect(getServiceById.mock.calls[0][0]).toBe('serviceid');
    expect(getServiceById.mock.calls[0][1]).toBe('correlationId');
  });

  it('then it should redirect to the service if only one service', async () => {
    req.userServices = {
      roles: [{
        code: 'serviceid_serviceconfiguration',
      }],
    };
    await getSelectService(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe('serviceid');
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
      services: [
        {
          id: 'serviceid',
          name: 'service one',
        },
        {
          id: 'serviceid1',
          name: 'service one',
        },
      ],
    });
  });
});
