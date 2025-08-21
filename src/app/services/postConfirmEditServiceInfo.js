const logger = require("../../infrastructure/logger");

const postEditServiceInfo = async (req, res) => {
  const model = req.session.postEditServiceInfo;

  // const serviceRoles = Get roles
  // if (serviceRoles) {
  //     const internalRoles = find roles ending with service configuation, service banner, Service Access Management and Service Support
  //     if (internalRoles) {
  //         Get policy and role data
  //         Shape it (renaming the start to the new name)
  //         Patch it
  //     }
  //}

  // Update name and description of service

  //await updatePolicyById(req.params.sid, req.params.pid, policy, req.id);

  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) updated the name and/or description of service ${req.params.sid}`,
    {
      type: "manage",
      subType: "service-info-edit",
      userId: req.user.sub,
      userEmail: req.user.email,
      name: model.name,
      description: model.description,
    },
  );

  req.session.editServiceInfo = undefined;
  res.flash("info", `Successfully updated service name and/or description `);

  return res.redirect("service-information");
};

module.exports = postEditServiceInfo;
