const { getAllUserOrganisations, getInvitationOrganisations } = require('./../../infrastructure/organisations');
const { getUsersByIdV2 } = require('./../../infrastructure/directories');
const { getUserDetails } = require('./utils');
const flatten = require('lodash/flatten');
const uniq = require('lodash/uniq');

const getApproverDetails = async (organisation, correlationId) => {
  const allApproverIds = flatten(organisation.map((org) => org.approvers));
  const distinctApproverIds = uniq(allApproverIds);
  if (distinctApproverIds.length === 0) {
    return [];
  }
  return await getUsersByIdV2(distinctApproverIds, correlationId);
};

const getOrganisations = async (userId, correlationId) => {
  const orgMapping = userId.startsWith('inv-') ? await getInvitationOrganisations(userId.substr(4), correlationId) : await getAllUserOrganisations(userId, correlationId);
  if (!orgMapping) {
    return [];
  }
  const allApprovers = await getApproverDetails(orgMapping, correlationId);

  return await Promise.all(orgMapping.map(async (invitation) => {
    const approvers = invitation.approvers.map((approverId) => {
      return allApprovers.find(x => x.sub.toLowerCase() === approverId.toLowerCase());
    }).filter(x => x);
    return {
      id: invitation.organisation.id,
      name: invitation.organisation.name,
      role: invitation.role,
      urn: invitation.organisation.urn,
      uid: invitation.organisation.uid,
      ukprn: invitation.organisation.ukprn,
      numericIdentifier: invitation.numericIdentifier,
      textIdentifier: invitation.textIdentifier,
      approvers,
    };
  }));
};

const getUserOrganisations = async (req, res) => {
  const user = await getUserDetails(req);
  const organisations = await getOrganisations(user.id, req.id);

  return res.render('services/views/userOrganisations', {
    csrfToken: req.csrfToken(),
    user,
    organisations,
    isInvitation: req.params.uid.startsWith('inv-'),
    backLink: true,
  })
};

module.exports = getUserOrganisations;
