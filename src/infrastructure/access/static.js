const services = [
  {
    userId: "user1",
    serviceId: "service1",
    roles: [
      {
        id: "roleId",
        name: "test",
        code: "test",
        status: {
          id: 1,
        },
      },
    ],
  },
];
const getServicesForUser = (id) => {
  const userServices = services.find(
    (x) => x.userId.toLowerCase() === id.toLowerCase(),
  );
  return Promise.resolve(userServices);
};

const getSingleUserService = () => Promise.resolve([]);

const getSingleInvitationService = () => Promise.resolve([]);

const getAllInvitationServices = () =>
  Promise.resolve([
    {
      invitationId: "D212N-12312-31231-312-56465",
      serviceId: "D212N-12312-31231-312-56465",
      organisationId: "D212N-12312-31231-312-56465",
      roles: [
        {
          id: "D212N-12312-31231-312-56465",
          name: "Test office",
          code: "test_code",
          numericId: "00000",
          status: { id: 1 },
        },
      ],
      identifiers: [],
      accessGrantedOn: "2022-07-25T16:13:54.621Z",
    },
  ]);

const listRolesOfService = async () => Promise.resolve([]);

const getPolicyById = async () => Promise.resolve();

const updatePolicyById = async () => Promise.resolve();

const updateRole = async () => Promise.resolve();

const addUserService = async () => Promise.resolve(null);

const addInvitationService = async () => Promise.resolve(null);

module.exports = {
  getServicesForUser,
  getSingleUserService,
  getSingleInvitationService,
  listRolesOfService,
  getPolicyById,
  updatePolicyById,
  updateRole,
  addInvitationService,
  addUserService,
  getAllInvitationServices,
};
