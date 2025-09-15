const logger = require("../../infrastructure/logger");
const { removeBanner } = require("../../infrastructure/applications");
const { getUserServiceRoles } = require("./utils");
const { dateFormat } = require("../helpers/dateFormatterHelper");
const { getServiceBannerRaw } = require("login.dfe.api-client/services");

const get = async (req, res) => {
  const serviceBanners = await getServiceBannerRaw({
    serviceId: req.params.sid,
    bannerId: req.params.bid,
  });
  serviceBanners.formattedValidFrom = serviceBanners.validFrom
    ? dateFormat(serviceBanners.validFrom, "longDateFormat")
    : "";
  serviceBanners.formattedValidTo = serviceBanners.validTo
    ? dateFormat(serviceBanners.validTo, "longDateFormat")
    : "";
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render("services/views/deleteServiceBanner", {
    csrfToken: req.csrfToken(),
    backLink: `/services/${req.params.sid}/service-banners/${req.params.bid}`,
    cancelLink: `/services/${req.params.sid}/service-banners/${req.params.bid}`,
    serviceId: req.params.sid,
    serviceBanners,
    userRoles: manageRolesForService,
    currentNavigation: "banners",
  });
};

const post = async (req, res) => {
  await removeBanner(req.params.sid, req.params.bid, req.id);

  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) removed banner ${req.params.bid} for service ${req.params.sid}`,
    {
      type: "manage",
      subType: "service-banner-deleted",
      userId: req.user.sub,
      userEmail: req.user.email,
      editedFields: [
        {
          name: "delete_banner",
          oldValue: req.params.bid,
          newValue: undefined,
        },
      ],
    },
  );

  res.flash("info", "Banner successfully deleted");
  res.redirect(`/services/${req.params.sid}/service-banners`);
};

module.exports = {
  get,
  post,
};
