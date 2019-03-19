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
        }
      }
    ]
  }
];
const getServicesForUser  = (id, correlationId) => {
  const services = services.find(x => x.userId.toLowerCase() === id.toLowerCase());
  return Promise.resolve(services);
};

const getSingleUserService = (id, sid, oid, correlationId) => {
  return Promise.resolve([]);
};

const getSingleInvitationService = (iid, sid, oid, correlationId) => {
  return Promise.resolve([]);
};

const listRolesOfService = async (sid, correlationId) => {
  return Promise.resolve([]);
};

const updateUserService = async (uid, sid, oid, role, correlationId) => {
  return Promise.resolve(null);
};

const updateInvitationService = async (iid, sid, oid, role, correlationId) => {
  return Promise.resolve(null);
};

const removeServiceFromUser = async(uid, sid, oid, correlationId) => {
  return Promise.resolve();
};

const removeServiceFromInvitation = async(iid, sid, oid, correlationId) => {
  return Promise.resolve();
};

module.exports = {
  getServicesForUser,
  getSingleUserService,
  getSingleInvitationService,
  listRolesOfService,
  updateUserService,
  updateInvitationService,
  removeServiceFromUser,
  removeServiceFromInvitation,
};
