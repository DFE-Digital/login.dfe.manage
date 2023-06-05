const flatten = require('lodash/flatten');
const uniq = require('lodash/uniq');
const { getAllUserOrganisations, getInvitationOrganisations } = require('../../infrastructure/organisations');
const { getUsersByIdV2 } = require('../../infrastructure/directories');
const { getUserDetails, getUserServiceRoles } = require('./utils');
const logger = require('../../infrastructure/logger');
const { getServiceById } = require('../../infrastructure/applications');
const { getServicesForUser, getAllInvitationServices } = require('../../infrastructure/access');

const getApproverDetails = async (organisation, correlationId) => {
  const allApproverIds = flatten(organisation.map((org) => org.approvers));
  const distinctApproverIds = uniq(allApproverIds);
  if (distinctApproverIds.length === 0) {
    return [];
  }
  const approverDetails = await getUsersByIdV2(distinctApproverIds, correlationId);
  return approverDetails;
};

const getOrganisations = async (userId, correlationId) => {
  const orgMapping = userId.startsWith('inv-') ? await getInvitationOrganisations(userId.substr(4), correlationId) : await getAllUserOrganisations(userId, correlationId);
  if (!orgMapping) {
    return [];
  }


  const allApprovers = await getApproverDetails(orgMapping, correlationId);

  return Promise.all(orgMapping.map(async (invitation) => {
    const approvers = invitation.approvers.map((approverId) => allApprovers.find((x) => x.sub.toLowerCase() === approverId.toLowerCase())).filter((x) => x);

    const services = await Promise.all(invitation.services.map(async (service) => ({
      id: service.id,
      name: service.name,
      userType: invitation.role,
      grantedAccessOn: service.requestDate ? new Date(service.requestDate) : null,
      serviceRoles: [],
    })));

    const selectedUserServices = userId.startsWith('inv-') ? await getAllInvitationServices(userId.substr(4),correlationId)
    : await getServicesForUser(userId, correlationId);

    const userOrgServices = selectedUserServices?.filter((s) => s.organisationId === invitation.organisation.id)|| [];

    services.map((service) => {
      const userServiceRole = userOrgServices.find((orgService) => service.id === orgService.serviceId);
      if (userServiceRole) {
        service.serviceRoles.push(...userServiceRole.roles);
      }
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
  }));
};

const getUserOrganisations = async (req, res) => {
  const user = await getUserDetails(req);

  const organisations = await getOrganisations(user.id, req.id);
  const visibleOrganisations = organisations.filter(o => o.status?.id !== 0)

  const manageRolesForService = await getUserServiceRoles(req);
  const currentService = await getServiceById(req.params.sid, req.id);

  logger.audit(`${req.user.email} (id: ${req.user.sub}) viewed user ${user.email} (id: ${user.id})`, {
    type: 'organisations',
    subType: 'user-view',
    userId: req.user.sub,
    userEmail: req.user.email,
    viewedUser: user.id,
  });

  return res.render('services/views/userOrganisations', {
    csrfToken: req.csrfToken(),
    user,
    organisations: visibleOrganisations,
    isInvitation: req.params.uid.startsWith('inv-'),
    backLink: true,
    serviceId: req.params.sid,
    userRoles: manageRolesForService,
    currentNavigation: 'users',
    currentService,
  });
};

module.exports = getUserOrganisations;
