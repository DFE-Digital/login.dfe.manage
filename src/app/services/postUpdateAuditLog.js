const { api } = require('./../../infrastructure/audit');

const postUpdateAuditLog = async (req, res) => {
  await api.updateAuditLogs();
  res.redirect(`/services/${req.params.sid}/users/${req.params.uid}/audit`);
};

module.exports = postUpdateAuditLog;
