jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/app/services/utils');
jest.mock('./../../../src/infrastructure/organisations');
jest.mock('./../../../src/infrastructure/directories');


const { getRequestMock, getResponseMock } = require('./../../utils');
const getUserOrganisations = require('./../../../src/app/services/getUserOrganisations');
const { getAllUserOrganisations, getInvitationOrganisations } = require('./../../../src/infrastructure/organisations');
const { getUsersByIdV2 } = require('./../../../src/infrastructure/directories');
const { getUserDetails } = require('./../../../src/app/services/utils');
const res = getResponseMock();

describe('when getting users organisation details', () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      user: {
        sub: 'user1',
        email: 'super.user@unit.test',
      },
      params: {
        uid: 'user1',
        sid: 'service1',
      },
      session: {},
    });

    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: 'user1',
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
      },
      {
        organisation: {
          id: 'fe68a9f4-a995-4d74-aa4b-e39e0e88c15d',
          name: 'Little Tiny School',
        },
        approvers: [
          "user1",
        ],
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
      },
      {
        organisation: {
          id: 'fe68a9f4-a995-4d74-aa4b-e39e0e88c15d',
          name: 'Little Tiny School',
        },
        approvers: [
          "user1",
        ],
      },
    ]);

    getUsersByIdV2.mockReset();
    getUsersByIdV2.mockReturnValue(
      [
        {sub: 'user1', given_name: 'User', family_name: 'One', email: 'user.one@unit.tests'},
        {sub: 'user6', given_name: 'User', family_name: 'Six', email: 'user.six@unit.tests'},
        {sub: 'user11', given_name: 'User', family_name: 'Eleven', email: 'user.eleven@unit.tests'},
      ]
    );
  });

  it('then it should get user details', async () => {
    await getUserOrganisations(req, res);

    expect(getUserDetails.mock.calls).toHaveLength(1);
    expect(getUserDetails.mock.calls[0][0]).toBe(req);
    expect(res.render.mock.calls[0][1].user).toMatchObject({
      id: 'user1',
    });
  });

  it('then it should get organisations mapping for user', async () => {
    await getUserOrganisations(req, res);

    expect(getAllUserOrganisations.mock.calls).toHaveLength(1);
    expect(getAllUserOrganisations.mock.calls[0][0]).toBe('user1');
    expect(getAllUserOrganisations.mock.calls[0][1]).toBe('correlationId');

    expect(res.render.mock.calls[0][1].organisations).toHaveLength(2);
    expect(res.render.mock.calls[0][1].organisations[0]).toMatchObject({
      id: '88a1ed39-5a98-43da-b66e-78e564ea72b0',
      name: 'Great Big School',
    });
    expect(res.render.mock.calls[0][1].organisations[1]).toMatchObject({
      id: 'fe68a9f4-a995-4d74-aa4b-e39e0e88c15d',
      name: 'Little Tiny School',
    });
  });

  it('then it should get organisations mapping for invitation', async () => {
    getUserDetails.mockReturnValue({
      id: 'inv-invitation1',
    });

    await getUserOrganisations(req, res);

    expect(getInvitationOrganisations.mock.calls).toHaveLength(1);
    expect(getInvitationOrganisations.mock.calls[0][0]).toBe('invitation1');
    expect(getInvitationOrganisations.mock.calls[0][1]).toBe('correlationId');

    expect(res.render.mock.calls[0][1].organisations).toHaveLength(2);
    expect(res.render.mock.calls[0][1].organisations[0]).toMatchObject({
      id: '88a1ed39-5a98-43da-b66e-78e564ea72b0',
      name: 'Great Big School',
    });
    expect(res.render.mock.calls[0][1].organisations[1]).toMatchObject({
      id: 'fe68a9f4-a995-4d74-aa4b-e39e0e88c15d',
      name: 'Little Tiny School',
    });
  });
});
