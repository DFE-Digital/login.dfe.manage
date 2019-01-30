'use strict';

const getDashboard = async (req, res) => {
  return res.render('services/views/dashboard.ejs', {
    csrfToken: req.csrfToken(),
    serviceId: req.params.sid,
  });
};

module.exports = {
  getDashboard,
};
