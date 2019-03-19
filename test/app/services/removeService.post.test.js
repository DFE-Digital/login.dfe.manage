jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/applications');
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/access');
jest.mock('./../../../src/app/services/utils');

const { getRequestMock, getResponseMock } = require('./../../utils');
const { getUserDetails } = require('./../../../src/app/services/utils');
const { getOrganisationByIdV2 } = require('./../../../src/infrastructure/organisations');
const { getServiceById } = require('./../../../src/infrastructure/applications');
const { removeServiceFromInvitation, removeServiceFromUser } = require('./../../../src/infrastructure/access');

const res = getResponseMock();

describe('when displaying the remove service access view', () => {
  let req;

  let postRemoveService;

  beforeEach(() => {
    req = getRequestMock();
    req.params = {
      uid: 'user1',
      oid: 'org1',
      sid: 'service1',
    };

    getServiceById.mockReset();
    getServiceById.mockReturnValue({
      id: 'service1',
      dateActivated: '10/10/2018',
      name: 'service name',
      status: 'active',
    });
    getOrganisationByIdV2.mockReset();
    getOrganisationByIdV2.mockReturnValue({
      id: 'org-1',
      name: 'organisation one'
    });
    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: 'user1',
      firstName: 'John',
      lastName: 'Doe'
    });

    removeServiceFromUser.mockReset();
    removeServiceFromInvitation.mockReset();

    postRemoveService = require('./../../../src/app/services/removeService').post;
  });

  it('then it should delete service for invitation if request for invitation', async () => {
    req.params.uid = 'inv-invite1';

    await postRemoveService(req, res);

    expect(removeServiceFromInvitation.mock.calls).toHaveLength(1);
    expect(removeServiceFromInvitation.mock.calls[0][0]).toBe('invite1');
    expect(removeServiceFromInvitation.mock.calls[0][1]).toBe('service1');
    expect(removeServiceFromInvitation.mock.calls[0][2]).toBe('org1');
    expect(removeServiceFromInvitation.mock.calls[0][3]).toBe('correlationId');
  });

  it('then it should delete service for user if request for user', async () => {

    await postRemoveService(req, res);

    expect(removeServiceFromUser.mock.calls).toHaveLength(1);
    expect(removeServiceFromUser.mock.calls[0][0]).toBe('user1');
    expect(removeServiceFromUser.mock.calls[0][1]).toBe('service1');
    expect(removeServiceFromUser.mock.calls[0][2]).toBe('org1');
    expect(removeServiceFromUser.mock.calls[0][3]).toBe('correlationId');
  });


  it('then a flash message is shown to the user', async () => {
    await postRemoveService(req, res);

    expect(res.flash.mock.calls).toHaveLength(1);
    expect(res.flash).toHaveBeenCalledWith('info', 'John Doe removed from service name');
  });


  it('then it should redirect to user details', async () => {
    await postRemoveService(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`/services/${req.params.sid}/users/${req.params.uid}/organisations`);
  });
});
