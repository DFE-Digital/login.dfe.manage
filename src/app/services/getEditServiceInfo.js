const { getServiceById } = require("../../infrastructure/applications");
const { getUserServiceRoles } = require("./utils");

const getEditServiceInfo = async (req, res) => {
  const service = await getServiceById(req.params.sid, req.id);
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render("services/views/editServiceInfo", {
    csrfToken: req.csrfToken(),
    model: {
      name: service.name || "",
      description: service.description || "",
      validationMessages: {},
    },
    service: {
      name: service.name || "",
    },
    backLink: `/services/${req.params.sid}`,
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentNavigation: "",
  });
};

module.exports = getEditServiceInfo;
