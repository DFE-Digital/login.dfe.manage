const { api } = require("../../infrastructure/audit");
const { getReturnOrgId } = require("./utils");

const postUpdateAuditLog = async (req, res) => {
  await api.updateAuditLogs();
  const returnOrgId = getReturnOrgId(req.query);
  res.redirect(`/services/${req.params.sid}/users/${req.params.uid}/audit${returnOrgId !== null ? `?returnOrg=${returnOrgId}` : ""}`);
};

module.exports = postUpdateAuditLog;
