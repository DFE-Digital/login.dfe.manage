const url = require("url");
const passport = require("passport");
const config = require("../../infrastructure/config");
const logger = require("../../infrastructure/logger");

const logout = (req) => {
  req.logout(() => {
    logger.info("user logged out.");
  });
  req.session = null; // Needed to clear session and completely logout
  req.user = null;
};

const signUserOut = (req, res) => {
  const baseUrl = `${config.hostingEnvironment.protocol}://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`;
  if (req.user && req.user.id_token) {
    const idToken = req.user.id_token;
    const issuer = passport._strategies.oidc._issuer;
    let returnUrl = `${baseUrl}/signout/complete`;

    if (req.query.timeout === "1") {
      returnUrl = `${baseUrl}/signout/session-timeout`;
    }

    logout(req);
    res.redirect(
      url.format(
        Object.assign(url.parse(issuer.end_session_endpoint), {
          search: null,
          query: {
            id_token_hint: idToken,
            post_logout_redirect_uri: returnUrl,
          },
        }),
      ),
    );
  } else {
    if (req.query.timeout === "1") {
      logout(req);
      return res.redirect(`${baseUrl}/signout/session-timeout`);
    }
    logout(req);
    res.redirect("/");
  }
};

module.exports = signUserOut;
