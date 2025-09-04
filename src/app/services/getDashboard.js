const { getServiceRaw } = require("login.dfe.api-client/services");
const { getUserServiceRoles } = require("./utils");

const getDashboard = async (req, res) => {
  if (req.session.serviceConfigurationChanges) {
    req.session.serviceConfigurationChanges = {};
  }

  const serviceDetails = await getServiceRaw({
    by: { serviceId: req.params.sid },
  });
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render("services/views/dashboard.ejs", {
    csrfToken: req.csrfToken(),
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    serviceDetails,
    currentNavigation: "dashboard",
  });
};

module.exports = {
  getDashboard,
};
