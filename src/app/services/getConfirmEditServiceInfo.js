const { getServiceById } = require("../../infrastructure/applications");
const { getUserServiceRoles } = require("./utils");

const getConfirmEditServiceInfo = async (req, res) => {
  if (!req.session.editServiceInfo) {
    // TODO figure out where to redirect too
    return res.redirect("edit");
  }
  const model = req.session.editServiceInfo;
  const service = await getServiceById(req.params.sid, req.id);
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render("services/views/confirmEditServiceInfo", {
    csrfToken: req.csrfToken(),
    model,
    service,
    backLink: `/services/${req.params.sid}`,
    cancelLink: `/services/${req.params.sid}`,
    currentNavigation: "policies",
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
  });
};

module.exports = getConfirmEditServiceInfo;
