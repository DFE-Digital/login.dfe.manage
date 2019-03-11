const { getSearchDetailsForUserById } = require('./../../infrastructure/search');
const { getInvitation } = require('./../../infrastructure/directories');
const { mapUserStatus } = require('./../../infrastructure/utils');

const getUserDetails = async (req) => {
  const uid = req.params.uid;
  if (uid.startsWith('inv-')) {
    const invitation = await getInvitation(uid.substr(4), req.id);
    return {
      id: uid,
      name: `${invitation.firstName} ${invitation.lastName}`,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      email: invitation.email,
      lastLogin: null,
      status: invitation.deactivated ? mapUserStatus(-2) : mapUserStatus(-1),
      loginsInPast12Months: {
        successful: 0,
      },
      deactivated: invitation.deactivated
    }
  } else {
    const user = await getSearchDetailsForUserById(uid);
    return {
      id: uid,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      lastLogin: user.lastLogin,
      status: user.status,
      loginsInPast12Months: {
        successful: user.successfulLoginsInPast12Months,
      },
      pendingEmail: user.pendingEmail,
    }
  }
};

module.exports = {
  getUserDetails,
};
