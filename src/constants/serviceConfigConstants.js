// Authentication Flows
const AUTHENTICATION_FLOWS = {
  AUTHORISATION_CODE_FLOW: 'authorisationCodeFlow',
  IMPLICIT_FLOW: 'implicitFlow',
  HYBRID_FLOW: 'hybridFlow',
  UNKNOWN_FLOW: 'unknownFlow',
};

// Response Types
const RESPONSE_TYPES = {
  CODE: 'code',
  ID_TOKEN: 'id_token',
  TOKEN: 'token',
};

// Grant Types
const GRANT_TYPES = {
  AUTHORIZATION_CODE: 'authorization_code',
  IMPLICIT: 'implicit',
  CLIENT_CREDENTIALS: 'client_credentials',
  REFRESH_TOKEN: 'refresh_token',
};

// Patterns for determining authentication flows based on response types
const AUTHENTICATION_FLOWS_PATTERNS = [
  { types: [RESPONSE_TYPES.CODE], flow: AUTHENTICATION_FLOWS.AUTHORISATION_CODE_FLOW },
  { types: [RESPONSE_TYPES.ID_TOKEN], flow: AUTHENTICATION_FLOWS.IMPLICIT_FLOW },
  { types: [RESPONSE_TYPES.ID_TOKEN, RESPONSE_TYPES.TOKEN], flow: AUTHENTICATION_FLOWS.IMPLICIT_FLOW },
  { types: [RESPONSE_TYPES.CODE, RESPONSE_TYPES.ID_TOKEN], flow: AUTHENTICATION_FLOWS.HYBRID_FLOW },
  { types: [RESPONSE_TYPES.CODE, RESPONSE_TYPES.TOKEN], flow: AUTHENTICATION_FLOWS.HYBRID_FLOW },
  { types: [RESPONSE_TYPES.CODE, RESPONSE_TYPES.ID_TOKEN, RESPONSE_TYPES.TOKEN], flow: AUTHENTICATION_FLOWS.HYBRID_FLOW },
];

// Token endpoint authentication method
const TOKEN_ENDPOINT_AUTH_METHOD = {
  CLIENT_SECRET_POST: 'client_secret_post',
  CLIENT_SECRET_BASIC: 'client_secret_basic',
};

// Error messages for Service config form validation
const ERROR_MESSAGES = {
  INVALID_HOME_URL: 'Please enter a valid home URL',
  INVALID_POST_PASSWORD_RESET_URL: 'Please enter a valid post password-reset URL',
  MISSING_REDIRECT_URL: 'At least one redirect URL must be specified',
  INVALID_REDIRECT_URL: 'Invalid redirect URL',
  REDIRECT_URLS_NOT_UNIQUE: 'Redirect URLs must be unique',
  MISSING_POST_LOGOUT_URL: 'At least one logout redirect URL must be specified',
  INVALID_POST_LOGOUT_URL: 'Invalid logout redirect URL',
  POST_LOGOUT_URL_NOT_UNIQUE: 'Logout redirect URLs must be unique',
  INVALID_CLIENT_SECRET: 'Invalid client secret',
  INVALID_API_SECRET: 'Invalid API secret',
  MISSING_RESPONSE_TYPE: 'Select at least 1 response type',
  RESPONSE_TYPE_TOKEN_ERROR: 'You must select more than 1 response type when selecting \'token\' as a response type',
  NO_CHANGES_MADE: 'No changes have been made',
};

// Query parameter actions
const ACTIONS = {
  AMEND_CHANGES: 'amendChanges',
};

// Base URL for amending Service config changes
const amendChangesBaseUrl = `service-configuration?action=${ACTIONS.AMEND_CHANGES}`;

// Service configuration fields and their description displayed in the `Review service configuration changes` page
const SERVICE_CONFIG_CHANGES_SUMMARY_DETAILS = {
  serviceHome: {
    title: 'Home URL',
    description: 'The home page of the service you want to configure. It is usually the service landing page from DfE Sign-in.',
    changeLink: `${amendChangesBaseUrl}#serviceHome-form-group`,
    displayOrder: 1,
  },
  postResetUrl: {
    title: 'Post password-reset URL',
    description: 'Where you want to redirect users after they have reset their password. It is usually the DfE Sign-in home page.',
    changeLink: `${amendChangesBaseUrl}#postResetUrl-form-group`,
    displayOrder: 2,
  },
  redirectUris: {
    title: 'Redirect URL',
    description: 'Where you want to redirect users after they have authenticated.',
    changeLink: `${amendChangesBaseUrl}#redirect_uris-form-group`,
    displayOrder: 3,
  },
  postLogoutRedirectUris: {
    title: 'Logout redirect URL',
    description: 'Where you want to redirect users after they log out of a service.',
    changeLink: `${amendChangesBaseUrl}#post_logout_redirect_uris-form-group`,
    displayOrder: 4,
  },
  responseTypes: {
    title: 'Response types',
    description: 'A value that determines the authentication flow.',
    changeLink: `${amendChangesBaseUrl}#response_types-form-group`,
    displayOrder: 5,
  },
  refreshToken: {
    title: 'Refresh token',
    description: 'Select this field if you want to get new access tokens when they have expired without interaction with the user.',
    changeLink: `${amendChangesBaseUrl}#refresh_token-form-group`,
    displayOrder: 6,
  },
  clientSecret: {
    title: 'Client secret',
    description: 'A value that is created automatically by the system and acts as a password for the service.',
    changeLink: `${amendChangesBaseUrl}#clientSecret-form-group`,
    displayOrder: 7,
  },
  tokenEndpointAuthMethod: {
    title: 'Token endpoint authentication method',
    description: 'The way your service authenticates to the DfE Sign-in token endpoint. Select the method that applies.',
    changeLink: `${amendChangesBaseUrl}#tokenEndpointAuthMethod-form-group`,
    displayOrder: 8,
  },

  apiSecret: {
    title: 'API Secret',
    description: 'A value that is created automatically by the system and acts as a password for the DfE Sign-in public API.',
    changeLink: `${amendChangesBaseUrl}#apiSecret-form-group`,
    displayOrder: 9,
  },
};

const REDIRECT_URLS_CHANGES = 'redirectUrlsChanges';

module.exports = {
  AUTHENTICATION_FLOWS,
  RESPONSE_TYPES,
  GRANT_TYPES,
  AUTHENTICATION_FLOWS_PATTERNS,
  ACTIONS,
  TOKEN_ENDPOINT_AUTH_METHOD,
  ERROR_MESSAGES,
  SERVICE_CONFIG_CHANGES_SUMMARY_DETAILS,
  REDIRECT_URLS_CHANGES,
};