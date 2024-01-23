jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('login.dfe.service-notifications.jobs.client');
jest.mock('./../../../src/app/services/utils');

const { getRequestMock, getResponseMock } = require('./../../utils');
const { getUserDetails } = require('./../../../src/app/services/utils');
const res = getResponseMock();
const ServiceNotificationsClient = require('login.dfe.service-notifications.jobs.client');
const webServiceSync = require('./../../../src/app/services/webServiceSync');

const user = { id: 'user-1', name: 'user one' };
const serviceNotificationsClient = {
  notifyUserUpdated: jest.fn(),
};

describe('when syncing user for sync', function () {
  let req;

  beforeEach(() => {
    getUserDetails.mockReset().mockReturnValue(user);

    serviceNotificationsClient.notifyUserUpdated.mockReset();
    ServiceNotificationsClient.mockReset().mockImplementation(() => serviceNotificationsClient);

    req = getRequestMock({
      params: {
        uid: 'user-1',
        sid: 'service-1'
      },
    });

    res.mockResetAll();
  });

  it('then it should prompt for confirmation with organisation details', async () => {
    await webServiceSync.get(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/webServiceSync');
  });

  // it('then it should queue organisation for sync on confirmation', async () => {
  //   await webServiceSync.post(req, res);

  //   expect(serviceNotificationsClient.notifyUserUpdated).toHaveBeenCalledTimes(1);
  //   expect(serviceNotificationsClient.notifyUserUpdated).toHaveBeenCalledWith({ sub: 'user-1' });
  // });

  // it('then it should add flash message that organisation has been queued on confirmation', async () => {
  //   await webServiceSync.post(req, res);

  //   expect(res.flash).toHaveBeenCalledTimes(1);
  //   expect(res.flash).toHaveBeenCalledWith('info', 'User has been queued for sync');
  // });

  // it('then it should redirect to organisation details page on confirmation', async () => {
  //   await webServiceSync.post(req, res);

  //   expect(res.redirect).toHaveBeenCalledTimes(1);
  //   expect(res.redirect).toHaveBeenCalledWith('/services/service-1/users/user-1/organisations');
  // });
});
