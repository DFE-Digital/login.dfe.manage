jest.mock('login.dfe.notifications.client');
jest.mock('./../../../src/infrastructure/config', () => require('../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('../../utils').loggerMockFactory());
jest.mock('./../../../src/app/services/utils');
jest.mock('./../../../src/infrastructure/access', () => ({
  addUserService: jest.fn(),
  addInvitationService: jest.fn(),
  listRolesOfService: jest.fn(),
}));

jest.mock('./../../../src/infrastructure/applications', () => ({
  getServiceById: jest.fn(),
}));
jest.mock('./../../../src/infrastructure/organisations', () => ({
  getOrganisationByIdV2: jest.fn(),
}));

const NotificationClient = require('login.dfe.notifications.client');

const sendServiceAdded = jest.fn();
const sendServiceRequestApproved = jest.fn();
NotificationClient.mockImplementation(() => ({
  sendServiceAdded,
  sendServiceRequestApproved,
}));

const logger = require('../../../src/infrastructure/logger');
const { getRequestMock, getResponseMock } = require('../../utils');
const { addInvitationService, addUserService, listRolesOfService } = require('../../../src/infrastructure/access');

const { getOrganisationByIdV2 } = require('../../../src/infrastructure/organisations');
const { getUserDetails } = require('../../../src/app/services/utils');
const { getServiceById } = require('../../../src/infrastructure/applications');

const res = getResponseMock();

describe('when confirm associating a service to user', () => {
  let req;

  let postConfirmAssociateService;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: 'user1',
        oid: 'org1',
        sid: 'service1',
      },
      session: {
        service: {
          roles: ['role_id'],
        },
      },
    });

    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: 'user1',
      name: 'John Doe',
    });

    getServiceById.mockReset();
    getServiceById.mockReturnValue({
      id: 'service1',
      dateActivated: '10/10/2018',
      name: 'service name',
      status: 'active',
    });

    listRolesOfService.mockReset();
    listRolesOfService.mockReturnValue([{
      code: 'role_code',
      id: 'role_id',
      name: 'role_name',
      status: {
        id: 'status_id',
      },
    }]);

    getOrganisationByIdV2.mockReset();
    getOrganisationByIdV2.mockReturnValue({
      id: 'org1',
      name: 'org name',
    });

    addUserService.mockReset();
    addInvitationService.mockReset();

    NotificationClient.mockReset();

    NotificationClient.mockImplementation(() => ({
      sendServiceAdded,
      sendServiceRequestApproved,
    }));

    res.mockResetAll();

    postConfirmAssociateService = require('../../../src/app/services/confirmAssociateService').post;
  });

  it('then it should associate service with invitation if request for invitation', async () => {
    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: 'inv-invite1',
      name: 'John Doe',
    });
    await postConfirmAssociateService(req, res);

    expect(addInvitationService.mock.calls).toHaveLength(1);
    expect(addInvitationService.mock.calls[0][0]).toBe('invite1');
    expect(addInvitationService.mock.calls[0][1]).toBe('service1');
    expect(addInvitationService.mock.calls[0][2]).toBe('org1');
    expect(addInvitationService.mock.calls[0][3]).toEqual(['role_id']);
    expect(addInvitationService.mock.calls[0][4]).toBe('correlationId');
  });

  it('then it should associate service with user if request for user', async () => {
    await postConfirmAssociateService(req, res);

    expect(addUserService.mock.calls).toHaveLength(1);
    expect(addUserService.mock.calls[0][0]).toBe('user1');
    expect(addUserService.mock.calls[0][1]).toBe('service1');
    expect(addUserService.mock.calls[0][2]).toBe('org1');
    expect(addUserService.mock.calls[0][3]).toEqual(['role_id']);
    expect(addUserService.mock.calls[0][4]).toBe('correlationId');
  });

  it('then it should should audit service being added', async () => {
    await postConfirmAssociateService(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe('user@unit.test (id: user1) added service service name for organisation org name (id: org1) for user undefined (id: user1)');
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: 'manage',
      subType: 'user-service-added',
      userId: 'user1',
      userEmail: 'user@unit.test',
      editedUser: 'user1',
      editedFields: [
        {
          name: 'add_services',
          newValue: { id: 'service1', roles: ['role_id'] },
        },
      ],
    });
  });

  it('then it should redirect to user details', async () => {
    await postConfirmAssociateService(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`/services/${req.params.sid}/users/${req.params.uid}/organisations`);
  });

  it('then a flash message is shown to the user', async () => {
    await postConfirmAssociateService(req, res);

    expect(res.flash.mock.calls).toHaveLength(3);
    expect(res.flash.mock.calls[0][0]).toBe('title');
    expect(res.flash.mock.calls[0][1]).toBe('Success');
    expect(res.flash.mock.calls[1][0]).toBe('heading');
    expect(res.flash.mock.calls[1][1]).toBe('Service added: service name');
    expect(res.flash.mock.calls[2][0]).toBe('message');
    expect(res.flash.mock.calls[2][1]).toBe('Approvers at the relevant organisation have been notified of this change.');
  });
});
