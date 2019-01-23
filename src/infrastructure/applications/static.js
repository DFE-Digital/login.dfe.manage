const applications = [];

const getServiceById = async (idOrClientId, correlationId) => {
  return applications.find(a => a.id.toLowerCase() === idOrClientId.toLowerCase() || (a.relyingParty && a.relyingParty.clientId.toLowerCase() === idOrClientId.toLowerCase()));
};

const updateService = async (id, body, correlationId) => {
  return Promise.resolve(null);
};
module.exports = {
  getServiceById,
  updateService,
};
