const config = require("../../infrastructure/config");
const { getOrganisationByIdV2 } = require("../../infrastructure/organisations");
const { getUserServiceRoles } = require("./utils");
const { wsSyncCall } = require("./wsSynchFunCall");

const get = async (req, res) => {
  const organisation = await getOrganisationByIdV2(req.params.oid, req.id);
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

  // res.flash('info', 'Organisation has been queued for sync');
  return res.redirect(
    `/services/${req.params.sid}/organisations/${req.params.oid}/users`,
  );
};
module.exports = {
  get,
  post,
};
