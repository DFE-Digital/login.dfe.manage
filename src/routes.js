const config = require('./infrastructure/config');
const healthCheck = require('login.dfe.healthcheck');
const services = require('./app/services');

const routes = (app, csrf) => {
  app.use('/healthcheck', healthCheck({
    config,
  }));

  app.use('/services', services(csrf));

  app.get('/', (req, res) => {
    res.redirect('/services');
  });
};

module.exports = routes;
