const {
  createServicePolicy,
  createServiceRole,
} = require("login.dfe.api-client/services");
const logger = require("../../../infrastructure/logger");

const postConfirmCreateNewPolicy = async (req, res) => {
  if (!req.session.createNewPolicy) {
    return res.redirect(`/services/${req.params.sid}/policies`);
  }

  const model = req.session.createNewPolicy;

  const rolePayload = {
    appId: req.params.sid,
    roleName: model.role.roleName,
    roleCode: model.role.roleCode,
  };

  let createdRoleId = undefined;

  try {
    const response = await createServiceRole(rolePayload);
    createdRoleId = response.id;
    logger.info(`New role created with id [${response.id}]`);
  } catch (e) {
    logger.error("Something went wrong creating the role", e);
    res.flash("error", "Something went wrong creating the policy");
    return res.redirect(`/services/${req.params.sid}/policies`);
  }

  const payload = {
    applicationId: req.params.sid,
    name: model.name,
    conditions: [
      {
        condition: model.condition.condition,
        operator: model.condition.operator,
        value: [model.condition.value],
      },
    ],
    roles: [createdRoleId],
  };

  // Note:  The endpoint to create a policy can support multiple roles and conditions
  // on creation.  We only did 1 so we could deliver the MVP, but a future
  // iteration of this feature could allow multiple roles and conditions to be added when
  // the policy is being created.
  try {
    const response = await createServicePolicy(payload);
    logger.info(`New policy created with id [${response.id}]`);
  } catch (e) {
    logger.error("Something went wrong creating the policy", e);
    res.flash("error", "Something went wrong creating the policy");
    return res.redirect(`/services/${req.params.sid}/policies`);
  }

  res.flash("info", `'${model.name}' policy was successfully created`);
  req.session.createNewPolicy = undefined;
  return res.redirect(`/services/${req.params.sid}/policies`);
};

module.exports = postConfirmCreateNewPolicy;
