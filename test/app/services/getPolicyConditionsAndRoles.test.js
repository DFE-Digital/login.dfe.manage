jest.mock('./../../../src/infrastructure/config', () => require('../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/applications');
jest.mock('./../../../src/infrastructure/access');

const { getRequestMock, getResponseMock } = require('../../utils');
const getPolicyConditions = require('../../../src/app/services/getPolicyConditionsAndRoles');
const { getServiceById } = require('../../../src/infrastructure/applications');
const { getPolicyById } = require('../../../src/infrastructure/access');

const res = getResponseMock();

describe('when displaying the confirm edit service view', () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        sid: 'service1',
        pid: 'policy1',
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
      dateActivated: '10/10/2018',
      name: 'service name',
      status: 'active',
    });

    getPolicyById.mockReset();
    getPolicyById.mockReturnValue({
      applicationId: 'service1',
      conditions: [
        {
          field: 'organisation.type.id',
          operator: 'is',
          value: [
            '46',
          ],
        },
      ],
      id: 'conditionId',
      name: 'condition name',
    });
  });

  it('then it should return the policy conditions view', async () => {
    await getPolicyConditions(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/policyConditionsAndRoles');
  });

  it('then it should include csrf token', async () => {
    await getPolicyConditions(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('then it should get the service by id', async () => {
    await getPolicyConditions(req, res);

    expect(getServiceById.mock.calls).toHaveLength(1);
    expect(getServiceById.mock.calls[0][0]).toBe('service1');
    expect(getServiceById.mock.calls[0][1]).toBe('correlationId');
  });

  it('then it should get the policy by id', async () => {
    await getPolicyConditions(req, res);

    expect(getPolicyById.mock.calls).toHaveLength(1);
    expect(getPolicyById.mock.calls[0][0]).toBe('service1');
    expect(getPolicyById.mock.calls[0][1]).toBe('policy1');
    expect(getPolicyById.mock.calls[0][2]).toBe('correlationId');
  });

  it('then it should include the mapped policy ', async () => {
    await getPolicyConditions(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      policy: {
        applicationId: 'service1',
        conditions: [
          {
            field: 'type',
            operator: 'is',
            value: [
              'Academy 16-19 Sponsor Led',
            ],
          },
        ],

      },
    });
  });
});
