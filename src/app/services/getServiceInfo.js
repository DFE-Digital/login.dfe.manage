const { getServiceRaw } = require("login.dfe.api-client/services");
const { doesUserHaveRole, getUserServiceRoles } = require("./utils");

const getServiceInfo = async (req, res) => {
  const service = await getServiceRaw({
    by: { serviceId: req.params.sid },
  });
  const manageRolesForService = await getUserServiceRoles(req);
  const canUserModifyService = doesUserHaveRole(
    req,
    "internalServiceConfigurationManager",
  );
  if (req.session.editServiceInfo) {
    req.session.editServiceInfo = undefined;
  }
  return res.render("services/views/serviceInfo", {
    csrfToken: req.csrfToken(),
    service: {
      name: service.name,
      description: service.description || "",
    },
    backLink: `/services/${req.params.sid}`,
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    canUserModifyService,
    currentNavigation: "",
  });
};

module.exports = getServiceInfo;
