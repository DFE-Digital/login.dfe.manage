jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/access', () => {
  return {
    addUserService: jest.fn(),
    addInvitationService: jest.fn(),
    listRolesOfService: jest.fn(),
  };
});
const { listRolesOfService } = require('./../../../src/infrastructure/access');
jest.mock('./../../../src/infrastructure/organisations', () => {
  return {
    getOrganisationByIdV2: jest.fn(),
    putUserInOrganisation: jest.fn(),
    putInvitationInOrganisation: jest.fn(),
    getPendingRequestsAssociatedWithUser: jest.fn(),
    updateRequestById: jest.fn(),
  };
});
jest.mock('./../../../src/infrastructure/directories', () => {
  return {
    createInvite: jest.fn(),
  };
});
jest.mock('./../../../src/infrastructure/search', () => {
  return {
    getSearchDetailsForUserById: jest.fn(),
    updateIndex: jest.fn(),
    createIndex: jest.fn(),
  };
});
jest.mock('login.dfe.notifications.client');

const NotificationClient = require('login.dfe.notifications.client');
const sendServiceAdded = jest.fn();
const sendServiceRequestApproved = jest.fn();
NotificationClient.mockImplementation(() => {
  return {
    sendServiceAdded,
    sendServiceRequestApproved,
  };
});

const { getRequestMock, getResponseMock } = require('./../../utils');
const { addUserService, addInvitationService } = require('./../../../src/infrastructure/access');
const { getOrganisationByIdV2, putInvitationInOrganisation, putUserInOrganisation} = require('./../../../src/infrastructure/organisations');
const { createInvite } = require('./../../../src/infrastructure/directories');
const { getSearchDetailsForUserById, updateIndex } = require('./../../../src/infrastructure/search');
const logger = require('./../../../src/infrastructure/logger');

const res = getResponseMock();
const postConfirmInvitation = require('./../../../src/app/services/confirmInvitation').post;

describe('when inviting a new user', () => {

  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: 'user1',
        sid: 'service1',
      },
      session: {
        user: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@unit.test',
          service: 'service name',
          organisationName: 'organisation name',
          organisationId: 'org1',
          permission: 10000,
          roles: [
            'role_id',
          ],
        },
      },
    });

    createInvite.mockReset();
    createInvite.mockReturnValue('invite1');

    putInvitationInOrganisation.mockReset();
    putUserInOrganisation.mockReset();
    addInvitationService.mockReset();
    addUserService.mockReset();

    getOrganisationByIdV2.mockReset();
    getOrganisationByIdV2.mockReturnValue({
      id: 'org1',
      name: 'org name',
      category: {
        id: '001'
      },
      status: {
        id: 1
      }
    });

    getSearchDetailsForUserById.mockReset();
    getSearchDetailsForUserById.mockReturnValue({
      organisations: [
        {
          id: "org1",
          name: "organisationId",
          categoryId: "004",
          statusId: 1,
          roleId: 0
        },
      ],
      services: [
        'service id',
      ],
    });

    updateIndex.mockReset();

    listRolesOfService.mockReset();
    listRolesOfService.mockReturnValue([{
      code: 'role_code',
      id: 'role_id',
      name: 'role_name',
      status: {
        id: 'status_id'
      },
    }]);

    sendServiceAdded.mockReset();
    sendServiceRequestApproved.mockReset();

    NotificationClient.mockReset();

    NotificationClient.mockImplementation(() => {
      return {
        sendServiceAdded,
        sendServiceRequestApproved
      };
    });

  });

  it('then it should redirect to users list if no user in session', async () => {
    req.session.user = undefined;
    await postConfirmInvitation(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe('/services/service1/users');
  });

  it('then it should create an invite if no uid exists in params', async () => {
    req.params.uid = null;
    await postConfirmInvitation(req, res);
    expect(createInvite.mock.calls).toHaveLength(1);
    expect(createInvite.mock.calls[0][0]).toBe('John');
    expect(createInvite.mock.calls[0][1]).toBe('Doe');
    expect(createInvite.mock.calls[0][2]).toBe('john.doe@unit.test');
    expect(createInvite.mock.calls[0][3]).toBe('services');
    expect(createInvite.mock.calls[0][4]).toBe('https://services.unit.test/auth');
  });

  it('then it should add invitation to organisation if not existingOrg', async () => {
    req.params.uid = 'inv-invite1';
    await postConfirmInvitation(req, res);

    expect(putInvitationInOrganisation.mock.calls).toHaveLength(1);
    expect(putInvitationInOrganisation.mock.calls[0][0]).toBe('invite1');
    expect(putInvitationInOrganisation.mock.calls[0][1]).toBe('org1');
    expect(putInvitationInOrganisation.mock.calls[0][2]).toBe(10000);
    expect(putInvitationInOrganisation.mock.calls[0][3]).toBe('correlationId');
  });

  it('then it should add service to invitation for organisation', async () => {
    req.params.uid = 'inv-invite1';
    await postConfirmInvitation(req, res);

    expect(addInvitationService.mock.calls).toHaveLength(1);
    expect(addInvitationService.mock.calls[0][0]).toBe('invite1');
    expect(addInvitationService.mock.calls[0][1]).toBe('service1');
    expect(addInvitationService.mock.calls[0][2]).toBe('org1');
    expect(addInvitationService.mock.calls[0][3]).toEqual(['role_id']);
    expect(addInvitationService.mock.calls[0][4]).toBe('correlationId');
  });

  it('then it should add user to organisation if not existingOrg', async () => {
    await postConfirmInvitation(req, res);

    expect(putUserInOrganisation.mock.calls).toHaveLength(1);
    expect(putUserInOrganisation.mock.calls[0][0]).toBe('user1');
    expect(putUserInOrganisation.mock.calls[0][1]).toBe('org1');
    expect(putUserInOrganisation.mock.calls[0][2]).toBe(10000);
    expect(putUserInOrganisation.mock.calls[0][3]).toBe('correlationId');
  });

  it('then it should add services to user', async () => {
    await postConfirmInvitation(req, res);

    expect(addUserService.mock.calls).toHaveLength(1);
    expect(addUserService.mock.calls[0][0]).toBe('user1');
    expect(addUserService.mock.calls[0][1]).toBe('service1');
    expect(addUserService.mock.calls[0][2]).toBe('org1');
    expect(addUserService.mock.calls[0][3]).toEqual(['role_id']);
    expect(addUserService.mock.calls[0][4]).toBe('correlationId');
  });

  it('then it should send support request job with form details', async () => {
    await postConfirmInvitation(req, res);

    expect(sendServiceRequestApproved.mock.calls).toHaveLength(1);
    expect(sendServiceRequestApproved.mock.calls[0][0]).toBe('john.doe@unit.test');
    expect(sendServiceRequestApproved.mock.calls[0][1]).toBe('John');
    expect(sendServiceRequestApproved.mock.calls[0][2]).toBe('Doe');
    expect(sendServiceRequestApproved.mock.calls[0][3]).toBe('organisation name');
    expect(sendServiceRequestApproved.mock.calls[0][4]).toBe('service name');
  });

  it('then it should not attempt to add user to organisation if existing user and existing org', async () => {
    req.params.uid = 'user1';
    req.session.user.existingOrg = true;
    await postConfirmInvitation(req, res);

    expect(putUserInOrganisation.mock.calls).toHaveLength(0);
  });

  it('then it should not attempt to add inv to organisation if existing inv and existing org', async () => {
    req.params.uid = 'inv-invitation1';
    req.session.user.existingOrg = true;
    await postConfirmInvitation(req, res);

    expect(putInvitationInOrganisation.mock.calls).toHaveLength(0);
  });

  it('then it should should audit an invited user if no uid in params', async () => {
    req.params.uid = undefined;
    await postConfirmInvitation(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe('user@unit.test (id: user1) invited john.doe@unit.test to organisation name (id: org1) (id: inv-invite1)');
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: 'manage',
      subType: 'user-invited',
      userId: req.user.sub,
      userEmail: req.user.email,
      invitedUserEmail: 'john.doe@unit.test',
      invitedUser: 'inv-invite1',
      organisationId: 'org1',
    });
  });

  it('then a flash message is displayed for a user being invited', async () => {
    req.params.uid = undefined;
    await postConfirmInvitation(req, res);

    expect(res.flash.mock.calls).toHaveLength(1);
    expect(res.flash.mock.calls[0][0]).toBe('info');
    expect(res.flash.mock.calls[0][1]).toBe(`Invitation email sent to john.doe@unit.test`)
  });

  it('then it should patch the user with the org added if existing user or inv', async () => {
    await postConfirmInvitation(req, res);

    expect(updateIndex.mock.calls).toHaveLength(2);
    expect(updateIndex.mock.calls[0][0]).toBe('user1');
    expect(updateIndex.mock.calls[0][1]).toEqual({
      organisations: [
        {
          id: "org1",
          name: "organisationId",
          categoryId: "004",
          statusId: 1,
          roleId: 0
        },
        {
          categoryId: '001',
          establishmentNumber: undefined,
          id: 'org1',
          laNumber: undefined,
          name: 'org name',
          roleId: 10000,
          statusId: 1,
          uid: undefined,
          urn: undefined,
        }
      ]
    });
    expect(updateIndex.mock.calls[0][2]).toBe('correlationId');
  });

  it('then it should patch the user with the service added if existing user or inv', async () => {
    await postConfirmInvitation(req, res);

    expect(updateIndex.mock.calls).toHaveLength(2);
    expect(updateIndex.mock.calls[1][0]).toBe('user1');
    expect(updateIndex.mock.calls[1][1]).toEqual({
      services: [
        'service id',
        'service1'
      ]
    });
    expect(updateIndex.mock.calls[1][2]).toBe('correlationId');
  });

  it('then it should should audit adding services to an existing user', async () => {
    await postConfirmInvitation(req, res);

    expect(logger.audit.mock.calls).toHaveLength(2);
    expect(logger.audit.mock.calls[1][0]).toBe('user@unit.test (id: user1) added services for organisation organisation name (id: org1) for user john.doe@unit.test (id: user1)');
    expect(logger.audit.mock.calls[1][1]).toMatchObject({
      type: 'manage',
      subType: 'user-services-added',
      userId: 'user1',
      userEmail: 'user@unit.test',
      editedUser: 'user1',
      editedFields: [{
        name: 'add_services',
        newValue: {
          id: 'service1',
          roles: ['role_id']
        },
      }],
    });
  });

  it('then a flash message is displayed for existing user service added', async () => {
    await postConfirmInvitation(req, res);

    expect(res.flash.mock.calls).toHaveLength(1);
    expect(res.flash.mock.calls[0][0]).toBe('info');
    expect(res.flash.mock.calls[0][1]).toBe(`service name added to John Doe at organisation name`)
  });

  it('then it should redirect to users list', async () => {
    req.params.uid = undefined;
    await postConfirmInvitation(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`/services/${req.params.sid}/users`);
  });

});
