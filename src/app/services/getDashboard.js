'use strict';

const getDashboard = async (req, res) => {
  return res.render('services/views/dashboard.ejs', {
    csrfToken: req.csrfToken(),
  });
};

module.exports = {
  getDashboard,
};
