'use strict';

const getDashboard = async (req, res) => {

  const userServices = req.userServices.roles.map((role) => ({
    id: role.code.substr(role.code.lastIndexOf('_') + 1),
    name: ''
  }));

  return res.render('services/views/dashboard.ejs', {
    csrfToken: req.csrfToken(),
    serviceId: req.params.sid,
  });
};

module.exports = {
  getDashboard,
};
