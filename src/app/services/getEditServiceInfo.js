const { getServiceRaw } = require("login.dfe.api-client/services");
const { getUserServiceRoles } = require("./utils");

const getEditServiceInfo = async (req, res) => {
  const service = await getServiceRaw({
    by: { serviceId: req.params.sid },
  });
  const manageRolesForService = await getUserServiceRoles(req);

  const model = {
    name: service.name,
    description: service.description,
    validationMessages: {},
  };

  // If we've returned here from the confirm page, use the modified values so
  // the user doesn't have to type it all out again.
  if (req.session.editServiceInfo) {
    Object.assign(model, req.session.editServiceInfo);
  }
  return res.render("services/views/editServiceInfo", {
    csrfToken: req.csrfToken(),
    model,
    service: {
      name: service.name,
    },
    backLink: `/services/${req.params.sid}/service-information`,
    cancelLink: `/services/${req.params.sid}/service-information`,
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentNavigation: "",
  });
};

module.exports = getEditServiceInfo;
