const getUserServiceRoles = async (req) => {
  const allUserRoles = req.userServices.roles.map((role) => ({
    serviceId: role.code.substr(0, role.code.indexOf("_")),
    role: role.code.substr(role.code.lastIndexOf("_") + 1),
  }));
  const userRolesForService = allUserRoles.filter(
    (x) => x.serviceId === req.params.sid,
  );
  return userRolesForService.map((x) => x.role);
};

module.exports = {
  getUserServiceRoles,
};
