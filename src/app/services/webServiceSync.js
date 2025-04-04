const { ServiceNotificationsClient } = require("login.dfe.jobs-client");
const config = require("../../infrastructure/config");
const { getUserDetails, getUserServiceRoles } = require("./utils");

const get = async (req, res) => {
  const user = await getUserDetails(req);
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render("services/views/webServiceSync", {
    user,
    csrfToken: req.csrfToken(),
    backLink: true,
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentNavigation: "users",
  });
};

const post = async (req, res) => {
  const serviceNotificationsClient = new ServiceNotificationsClient(
    config.notifications,
  );
  await serviceNotificationsClient.notifyUserUpdated({ sub: req.params.uid });

  res.flash("info", "User has been queued for sync");
  return res.redirect(
    `/services/${req.params.sid}/users/${req.params.uid}/organisations`,
  );
};

module.exports = {
  get,
  post,
};
