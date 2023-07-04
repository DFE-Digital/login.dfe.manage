const healthCheck = require('login.dfe.healthcheck');
const config = require('./infrastructure/config');
const services = require('./app/services');
const onboarding = require('./app/onboarding');
const signOut = require('./app/signOut');

const routes = (app, csrf) => {
  app.use('/healthcheck', healthCheck({
    config,
  }));

  app.use('/services', services(csrf));

  app.get('/', (req, res) => {
    res.redirect('/services');
  });

  app.use('/onboarding', onboarding(csrf));

  app.use('/signout', signOut(csrf));

  app.get('*', (req, res) => {
    res.status(404).render('errors/views/notFound');
  });
};

module.exports = routes;
