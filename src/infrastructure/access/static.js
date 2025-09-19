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

const updateRole = async () => Promise.resolve();

module.exports = {
  getServicesForUser,
  updateRole,
};
