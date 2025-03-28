const { getPolicyById } = require("../../infrastructure/access");
const {
  getUserServiceRoles,
  getFriendlyFieldName,
  getFriendlyValues,
} = require("./utils");

const getConfirmRemovePolicyCondition = async (req, res) => {
  const condition = req.query.condition;
  const operator = req.query.operator;
  const value = req.query.value;
  const correlationId = req.id;
  const manageRolesForService = await getUserServiceRoles(req);

  const policy = await getPolicyById(
    req.params.sid,
    req.params.pid,
    correlationId,
  );

  const friendlyValue = await getFriendlyValues(
    condition,
    [value],
    correlationId,
  );
  const friendlyField = getFriendlyFieldName(condition);

  return res.render("services/views/confirmRemovePolicyCondition", {
    csrfToken: req.csrfToken(),
    condition,
    operator,
    value,
    policy,
    friendlyField,
    friendlyValue,
    cancelLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    backLink: `/services/${req.params.sid}/policies/${req.params.pid}/conditionsAndRoles`,
    currentNavigation: "policies",
    userRoles: manageRolesForService,
  });
};

module.exports = getConfirmRemovePolicyCondition;
