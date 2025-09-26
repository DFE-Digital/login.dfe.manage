const flatten = require("lodash/flatten");
const uniq = require("lodash/uniq");
const {
  getUsersRaw,
  getUserServicesRaw,
  getUserOrganisationsWithServicesRaw,
} = require("login.dfe.api-client/users");
const {
  getInvitationOrganisationsRaw,
} = require("login.dfe.api-client/invitations");
const {
  getUserDetails,
  getUserServiceRoles,
  getReturnOrgId,
} = require("./utils");
const logger = require("../../infrastructure/logger");
const { getServiceRaw } = require("login.dfe.api-client/services");
const {
  getInvitationServicesRaw,
} = require("login.dfe.api-client/invitations");

const getApproverDetails = async (organisation) => {
  const allApproverIds = flatten(organisation.map((org) => org.approvers));
  const distinctApproverIds = uniq(allApproverIds);
  if (distinctApproverIds.length === 0) {
    return [];
  }
  const approverDetails = await getUsersRaw({
    by: { userIds: distinctApproverIds },
  });
  return approverDetails;
};

const getOrganisations = async (userId) => {
  const orgMapping = userId.startsWith("inv-")
    ? await getInvitationOrganisationsRaw({ invitationId: userId.substr(4) })
    : await getUserOrganisationsWithServicesRaw({ userId });
  if (!orgMapping) {
    return [];
  }

  const allApprovers = await getApproverDetails(orgMapping);

  return Promise.all(
    orgMapping.map(async (invitation) => {
      const approvers = invitation.approvers
        .map((approverId) =>
          allApprovers.find(
            (x) => x.sub.toLowerCase() === approverId.toLowerCase(),
          ),
        )
        .filter((x) => x);

      const services = await Promise.all(
        invitation.services.map(async (service) => ({
          id: service.id,
          name: service.name,
          userType: invitation.role,
          grantedAccessOn: service.requestDate
            ? new Date(service.requestDate)
            : null,
          serviceRoles: [],
        })),
      );

      const selectedUserServices = userId.startsWith("inv-")
        ? await getInvitationServicesRaw({ userInvitationId: userId.substr(4) })
        : await getUserServicesRaw({ userId });

      const userOrgServices =
        selectedUserServices?.filter(
          (s) => s.organisationId === invitation.organisation.id,
        ) || [];

      services.map((service) => {
        const userServiceRole = userOrgServices.find(
          (orgService) => service.id === orgService.serviceId,
        );
        if (userServiceRole) {
          service.serviceRoles.push(...userServiceRole.roles);
        }
        service.serviceRoles.sort((a, b) => a.name.localeCompare(b.name));
        return service;
      });

      return {
        id: invitation.organisation.id,
        name: invitation.organisation.name,
        LegalName: invitation.organisation.LegalName,
        status: invitation.organisation.status,
        role: invitation.role,
        urn: invitation.organisation.urn,
        uid: invitation.organisation.uid,
        ukprn: invitation.organisation.ukprn,
        numericIdentifier: invitation.numericIdentifier,
        textIdentifier: invitation.textIdentifier,
        approvers,
        services,
      };
    }),
  );
};

const getUserOrganisations = async (req, res) => {
  const user = await getUserDetails(req);

  const organisations = await getOrganisations(user.id);
  const visibleOrganisations = organisations
    .filter((o) => o.status?.id !== 0)
    .map((org) => {
      const sortedOrg = { ...org };

      if (sortedOrg.services && sortedOrg.services.length > 0) {
        sortedOrg.services.sort((a, b) => a.name.localeCompare(b.name));
      }

      return sortedOrg;
    });

  const manageRolesForService = await getUserServiceRoles(req);
  const currentService = await getServiceRaw({
    by: { serviceId: req.params.sid },
  });

  logger.audit(`${req.user.email} viewed user ${user.email}`, {
    type: "organisations",
    subType: "user-view",
    userId: req.user.sub,
    userEmail: req.user.email,
    viewedUser: user.id,
  });

  let backLink = `/services/${req.params.sid}/users`;
  const returnOrgId = getReturnOrgId(req.query);
  if (returnOrgId !== null) {
    backLink = `/services/${req.params.sid}/organisations/${returnOrgId}/users`;
  }

  return res.render("services/views/userOrganisations", {
    csrfToken: req.csrfToken(),
    user,
    organisations: visibleOrganisations,
    isInvitation: req.params.uid.startsWith("inv-"),
    backLink,
    serviceId: req.params.sid,
    returnOrgId,
    userRoles: manageRolesForService,
    currentNavigation: "users",
    currentService,
  });
};

module.exports = getUserOrganisations;
