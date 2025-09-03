const { getServiceById } = require("../../infrastructure/applications");
const { getUserServiceRoles } = require("./utils");

const getConfirmEditServiceInfo = async (req, res) => {
  if (!req.session.editServiceInfo) {
    return res.redirect(`/services/${req.params.sid}/service-information`);
  }
  const model = req.session.editServiceInfo;
  const service = await getServiceById(req.params.sid, req.id);
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render("services/views/confirmEditServiceInfo", {
    csrfToken: req.csrfToken(),
    model,
    service,
    backLink: `/services/${req.params.sid}/service-information/edit`,
    cancelLink: `/services/${req.params.sid}/service-information`,
    currentNavigation: "",
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
  });
};

module.exports = getConfirmEditServiceInfo;
