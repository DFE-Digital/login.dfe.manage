const { getServiceById } = require("../../infrastructure/applications");
const { getUserServiceRoles } = require("./utils");

const getConfirmEditServiceInfo = async (req, res) => {
  const service = await getServiceById(req.params.sid, req.id);
  const manageRolesForService = await getUserServiceRoles(req);

  if (!req.session.editServiceInfo) {
    return res.redirect("edit");
  }
  const model = req.session.editServiceInfo;

  return res.render("services/views/confirmCreatePolicyCondition", {
    csrfToken: req.csrfToken(),
    condition: model.condition,
    operator: model.operator,
    service,
    value: model.value,
    backLink: `/services/${req.params.sid}`,
    cancelLink: `/services/${req.params.sid}`,
    currentNavigation: "policies",
    userRoles: manageRolesForService,
  });
};

module.exports = getConfirmEditServiceInfo;
