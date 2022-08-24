'use strict';

const url = require('url');
const passport = require('passport');
const config = require('./../../infrastructure/config');

const signUserOut = (req, res) => {
  const baseUrl = `${config.hostingEnvironment.protocol}://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`;
  if (req.user && req.user.id_token) {
    const idToken = req.user.id_token;
    const issuer = passport._strategies.oidc._issuer;
    let returnUrl = `${baseUrl}/signout/complete`;

    if (req.query.timeout === '1') {
      returnUrl = `${baseUrl}/signout/session-timeout`;
    }

    req.logout();
    res.redirect(url.format(Object.assign(url.parse(issuer.end_session_endpoint), {
      search: null,
      query: {
        id_token_hint: idToken,
        post_logout_redirect_uri: returnUrl,
      },
    })));
  } else {
    if (req.query.timeout === '1') {
      req.logout();
      req.session = null;
      return res.redirect(`${baseUrl}/signout/session-timeout`);
    }

    res.redirect('/');
  }
};

module.exports = signUserOut;
