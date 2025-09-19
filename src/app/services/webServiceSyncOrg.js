const { getOrganisationRaw } = require("login.dfe.api-client/organisations");
const { getUserServiceRoles } = require("./utils");
const { wsSyncCall } = require("./wsSynchFunCall");

const get = async (req, res) => {
  const organisation = await getOrganisationRaw({
    by: { organisationId: req.params.oid },
  });
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render("services/views/webServiceSyncOrg", {
    csrfToken: req.csrfToken(),
    backLink: true,
    organisation,
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentNavigation: "organisations",
  });
};
const post = async (req, res) => {
  await wsSyncCall(req.params.oid);

  return res.redirect(
    `/services/${req.params.sid}/organisations/${req.params.oid}/users`,
  );
};
module.exports = {
  get,
  post,
};
