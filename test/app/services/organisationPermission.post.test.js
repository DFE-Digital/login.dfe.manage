jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/infrastructure/applications');

const { getRequestMock, getResponseMock } = require('./../../utils');
const res = getResponseMock();
const postOrganisationPermission = require('./../../../src/app/services/organisationPermission').post;
const { getServiceById } = require('./../../../src/infrastructure/applications');

describe('when displaying the select permission page', () => {

  let req;

  beforeEach(() => {
    req = getRequestMock({
      session: {
        user: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          organisationName: 'org name',
        }
      },
      params: {
        uid: 'user1',
        sid: 'service1'
      },
      body: {
        selectedLevel: 10000,
      }
    });

    getServiceById.mockReset();
    getServiceById.mockReturnValue({
      id: 'service1',
      dateActivated: '10/10/2018',
      name: 'service name',
      status: 'active',
    });
  });

  it('then it should render validation message if no permission level selected', async () => {
    req.body.selectedLevel = undefined;

    await postOrganisationPermission(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe(`services/views/organisationPermission`);
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: 'token',
      backLink: true,
      selectedLevel: undefined,
      organisation: 'org name',
      cancelLink: '/services/service1/users',
      service: {
        id: 'service1',
        dateActivated: '10/10/2018',
        name: 'service name',
        status: 'active',
      },
      user: 'John Doe',
      validationMessages: {
        selectedLevel: 'Please select a permission level',
      },
    });
  });

  it('then it should render validation message if invalid permission level', async () => {
    req.body.selectedLevel = 10;

    await postOrganisationPermission(req, res);
    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe(`services/views/organisationPermission`);
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: 'token',
      backLink: true,
      selectedLevel: 10,
      organisation: 'org name',
      cancelLink: '/services/service1/users',
      service: {
        id: 'service1',
        dateActivated: '10/10/2018',
        name: 'service name',
        status: 'active',
      },
      user: 'John Doe',
      validationMessages: {
        selectedLevel: 'Please select a permission level',
      },
    });
  });

  it('then it should redirect to users list if no user in session', async () => {
    req.session.user = undefined;
    await postOrganisationPermission(req, res);

    expect(res.redirect.mock.calls.length).toBe(1);
    expect(res.redirect.mock.calls[0][0]).toBe('/services/service1/users');
  });

  it('then it should redirect to the associate roles page ', async () => {
    await postOrganisationPermission(req, res);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`associate-roles`);
  });
});
