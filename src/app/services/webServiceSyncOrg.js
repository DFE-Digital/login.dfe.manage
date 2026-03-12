const { getOrganisationRaw } = require("login.dfe.api-client/organisations");
const { getUserServiceRoles } = require("./utils");
const { wsSyncCall } = require("./wsSynchFunCall");
const logger = require("../../infrastructure/logger");

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
  try {
    const result = await wsSyncCall(req.params.oid);
    if (result?.status === "success") {
      res.flash("success", "Web service sync completed successfully");
    } else {
      res.flash("info", "No data was available to sync for this organisation");
      logger.info(
        `Sync call returned unexpected result for org [${req.params.oid}].`,
      );
    }
  } catch (e) {
    res.flash("error", "Something went wrong during web service sync");
    logger.error("Something went wrong during web service sync", e);
  }

  return res.redirect(
    `/services/${req.params.sid}/organisations/${req.params.oid}/users`,
  );
};
module.exports = {
  get,
  post,
};
