const { api } = require("../../infrastructure/audit");
const { getReturnUrl } = require("./utils");

const postUpdateAuditLog = async (req, res) => {
  await api.updateAuditLogs();
  res.redirect(
    getReturnUrl(
      req.query,
      `/services/${req.params.sid}/users/${req.params.uid}/audit`,
    ),
  );
};

module.exports = postUpdateAuditLog;
