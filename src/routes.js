const config = require('./infrastructure/config');
const healthCheck = require('login.dfe.healthcheck');
const services = require('./app/services');
const signOut = require('./app/signOut');

const routes = (app, csrf) => {
  app.use('/healthcheck', healthCheck({
    config,
  }));

  app.use('/services', services(csrf));

  app.get('/', (req, res) => {
    res.redirect('/services');
  });

  app.use('/signout', signOut(csrf));

  app.get('*', (req, res) => {
    res.status(404).render('errors/views/notFound');
  });
};

module.exports = routes;
