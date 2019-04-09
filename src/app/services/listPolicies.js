
const get = async (req, res) => {
  return res.render('services/views/listPolicies', {
    csrfToken: req.csrfToken(),
    backLink: true,
  });
};

module.exports = {
  get,
};
