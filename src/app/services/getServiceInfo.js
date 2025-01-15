const { getServiceById } = require("../../infrastructure/applications");
const { getUserServiceRoles } = require("./utils");

const getServiceInfo = async (req, res) => {
  const service = await getServiceById(req.params.sid, req.id);
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render("services/views/serviceInfo", {
    csrfToken: req.csrfToken(),
    service: {
      name: service.name || "",
      description: service.description || "",
    },
    backLink: `/services/${req.params.sid}`,
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentNavigation: "",
  });
};

module.exports = getServiceInfo;
