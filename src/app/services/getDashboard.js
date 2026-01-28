const { getServiceRaw } = require("login.dfe.api-client/services");
const { getUserServiceRoles } = require("./utils");

const getDashboard = async (req, res) => {
  const { sid } = req.params;
  delete req.session.serviceConfigurationChanges?.[sid];

  const serviceDetails = await getServiceRaw({
    by: { serviceId: sid },
  });
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render("services/views/dashboard.ejs", {
    csrfToken: req.csrfToken(),
    serviceId: sid,
    userRoles: manageRolesForService,
    serviceDetails,
    currentNavigation: "dashboard",
  });
};

module.exports = {
  getDashboard,
};
