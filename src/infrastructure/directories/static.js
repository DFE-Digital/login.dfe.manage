const getInvitation = async (invitationId, correlationId) => {
  return {
    firstName: 'Some',
    lastName: 'User',
    email: 'some.user@test.local',
    keyToSuccessId: '1234567',
    tokenSerialNumber: '12345678901',
    id: invitationId
  };
};

const getUsersByIdV2 = async(userIds, correlationId) => {
  return Promise.resolve([]);
};

module.exports = {
  getInvitation,
  getUsersByIdV2,
};
