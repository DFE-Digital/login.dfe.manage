const { getReturnUrl } = require("./utils");

const postUpdateAuditLog = async (req, res) => {
  await fetch(`${process.env.AUDIT_HTTP_TRIGGER_URL}`, {
    method: "POST",
  });

  res.redirect(
    getReturnUrl(
      req.query,
      `/services/${req.params.sid}/users/${req.params.uid}/audit`,
    ),
  );
};

module.exports = postUpdateAuditLog;
