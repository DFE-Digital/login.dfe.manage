jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/organisations');

const { getRequestMock, getResponseMock } = require('./../../utils');
const res = getResponseMock();
const getSelectOrg = require('./../../../src/app/services/selectOrganisation').get;
const { getAllUserOrganisations, getInvitationOrganisations } = require('./../../../src/infrastructure/organisations');

describe('when displaying the select org view', () => {

  let req;

  beforeEach(() => {
    req = getRequestMock({
      session: {
        user: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com'
        }
      },
      params: {
        uid: 'user1',
        sid: 'service1'
      }
    });
    getAllUserOrganisations.mockReset();
    getAllUserOrganisations.mockReturnValue([
      {
        organisation: {
          id: '88a1ed39-5a98-43da-b66e-78e564ea72b0',
          name: 'Great Big School',
        },
        approvers: [
          "user1",
        ],
        services: [
          {
            id: 'service1',
          }
        ],
      },
      {
        organisation: {
          id: 'fe68a9f4-a995-4d74-aa4b-e39e0e88c15d',
          name: 'Little Tiny School',
        },
        approvers: [
          "user1",
        ],
        services: [
          {
            id: 'service1',
          }
        ]
      },
    ]);

    getInvitationOrganisations.mockReset();
    getInvitationOrganisations.mockReturnValue([
      {
        organisation: {
          id: '88a1ed39-5a98-43da-b66e-78e564ea72b0',
          name: 'Great Big School',
        },
        approvers: [
          "user1",
        ],
        services: [
          {
            id: 'service1',
          }
        ],
      },
      {
        organisation: {
          id: 'fe68a9f4-a995-4d74-aa4b-e39e0e88c15d',
          name: 'Little Tiny School',
        },
        approvers: [
          "user1",
        ],
        services: [
          {
            id: 'service1',
          }
        ],
      },
    ]);
  });

  it('then it should return the user details view', async () => {
    await getSelectOrg(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe('services/views/selectOrganisation');
  });

  it('then it should include csrf token in model', async () => {
    await getSelectOrg(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('then it should include the user details from session', async () => {
    await getSelectOrg(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      user: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com'
      }
    });
  });

  it('then it should get orgs for user if user', async () => {
    await getSelectOrg(req, res);

    expect(getAllUserOrganisations.mock.calls).toHaveLength(1);
    expect(getAllUserOrganisations.mock.calls[0][0]).toBe('user1');
    expect(getAllUserOrganisations.mock.calls[0][1]).toBe('correlationId');
  });

  it('then it should get orgs for inv if inv', async () => {
    req.params.uid = 'inv-user1';

    await getSelectOrg(req, res);

    expect(getInvitationOrganisations.mock.calls).toHaveLength(1);
    expect(getInvitationOrganisations.mock.calls[0][0]).toBe('user1');
    expect(getInvitationOrganisations.mock.calls[0][1]).toBe('correlationId');
  });
});
