const get = async (req, res) => {
  return res.render('services/views/confirmEditService', {
    csrfToken: req.csrfToken(),
  });
};

module.exports = {
  get,
};
