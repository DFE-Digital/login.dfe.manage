'use strict';

const { getUserServiceRoles } = require('../../../utils/getUserServiceRoles');

const getStartPage = async (req, res) => {
  const manageRolesForService = await getUserServiceRoles(req);

  return res.render('onboarding/service/views/startPage', {
    csrfToken: req.csrfToken(),
    backLink: `/services/${req.params.sid}`,
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentNavigation: 'onboarding',
  });
};

module.exports = getStartPage;
