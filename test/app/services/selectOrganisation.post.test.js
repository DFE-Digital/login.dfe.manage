jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/organisations');

const { getRequestMock, getResponseMock } = require('./../../utils');
const res = getResponseMock();
const postSelectOrg = require('./../../../src/app/services/selectOrganisation').post;
const { getAllUserOrganisations, getInvitationOrganisations } = require('./../../../src/infrastructure/organisations');

describe('when selecting an organisation', () => {

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
      },
      body: {
        selectedOrganisation: 'organisationId'
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

  it('then it should render validation message if no selected organisation', async () => {
    req.body.selectedOrganisation = undefined;

    await postSelectOrg(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe(`services/views/selectOrganisation`);
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: 'token',
      backLink: true,
      cancelLink: '/services/service1/users',
      selectedOrganisation: undefined,
      validationMessages: {
        selectedOrganisation: 'Please select an organisation',
      },
      user: {
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
      },
      organisations: [
        {
          approvers: [
            'user1'
          ],
          naturalIdentifiers: [],
          organisation: {
            id: '88a1ed39-5a98-43da-b66e-78e564ea72b0',
            name: 'Great Big School'
          },
          services: [
            {
              id: 'service1'
            }
          ]
        },
        {
          approvers: [
            'user1'
          ],
          naturalIdentifiers: [],
          organisation: {
            id: 'fe68a9f4-a995-4d74-aa4b-e39e0e88c15d',
            name: 'Little Tiny School'
          },
          services: [
            {
              id: 'service1'
            }
          ]
        }
      ],
    });
  });

  it('then it should redirect to the associate roles page ', async () => {
    await postSelectOrg(req, res);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`associate-roles`);
  });
});
