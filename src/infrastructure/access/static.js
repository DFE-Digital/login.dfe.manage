const services = [
  {
    userId: 'user1',
    serviceId: 'service1',
    roles: [
      {
        id: 'roleId',
        name: 'test',
        code: 'test',
        status: {
          id: 1,
        },
      },
    ],
  },
];
const getServicesForUser = (id, correlationId) => {
  const userServices = services.find((x) => x.userId.toLowerCase() === id.toLowerCase());
  return Promise.resolve(userServices);
};

const getSingleUserService = (id, sid, oid, correlationId) => Promise.resolve([]);

const getSingleInvitationService = (iid, sid, oid, correlationId) => Promise.resolve([]);

const getAllInvitationServices = (iid, corellationId)=> Promise.resolve(
  [
    {
      invitationId: 'D212N-12312-31231-312-56465',
      serviceId: 'D212N-12312-31231-312-56465',
      organisationId: 'D212N-12312-31231-312-56465',
      roles: [
        {
          id: 'D212N-12312-31231-312-56465',
          name: 'Test office',
          code: 'test_code',
          numericId: '00000',
          status: { id: 1 },
        },
      ],
      identifiers: [],
      accessGrantedOn: '2022-07-25T16:13:54.621Z',
    },
  ],
);

const listRolesOfService = async (sid, correlationId) => Promise.resolve([]);

const updateUserService = async (uid, sid, oid, role, correlationId) => Promise.resolve(null);

const updateInvitationService = async (iid, sid, oid, role, correlationId) => Promise.resolve(null);

const removeServiceFromUser = async (uid, sid, oid, correlationId) => Promise.resolve();

const removeServiceFromInvitation = async (iid, sid, oid, correlationId) => Promise.resolve();

const getPageOfPoliciesForService = async (sid, page, pageSize, correlationId) => Promise.resolve({
  policies: {
    id: 'policyId',
    applicationId: 'serviceId',
    name: 'policy name',
    status: {
      id: '1',
    },
    conditions: [],
    roles: [],
  },
  page,
  totalNumberOfPages: 1,
  totalNumberOfRecords: 1,
});

const getPolicyById = async (sid, pid, correlationId) => Promise.resolve();

const addUserService = async (uid, sid, oid, role, correlationId) => Promise.resolve(null);

const addInvitationService = async (iid, sid, oid, role, correlationId) => Promise.resolve(null);

module.exports = {
  getServicesForUser,
  getSingleUserService,
  getSingleInvitationService,
  listRolesOfService,
  updateUserService,
  updateInvitationService,
  removeServiceFromUser,
  removeServiceFromInvitation,
  getPageOfPoliciesForService,
  getPolicyById,
  addInvitationService,
  addUserService,
  getAllInvitationServices,
};
