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
  INVALID_HOME_URL: 'Enter a home URL in the correct format',
  INVALID_POST_PASSWORD_RESET_URL: 'Enter a post password-reset URL in the correct format',
  MISSING_CLIENT_ID: 'Enter the client ID',
  INVALID_CLIENT_ID: 'Client ID must only contain letters a to z, hyphens and numbers',
  INVALID_CLIENT_ID_LENGTH: 'Client ID must be 50 characters or less',
  CLIENT_ID_UNAVAILABLE: 'Client ID must be unique',
  MISSING_REDIRECT_URL: 'Enter at least 1 redirect URL',
  INVALID_REDIRECT_URL: 'Enter a redirect URL in the correct format',
  REDIRECT_URLS_NOT_UNIQUE: 'Redirect URL must be unique',
  MISSING_POST_LOGOUT_URL: 'Enter at least 1 logout redirect URL',
  INVALID_POST_LOGOUT_URL: 'Enter a logout redirect URL in the correct format',
  POST_LOGOUT_URL_NOT_UNIQUE: 'Logout redirect URL must be unique',
  INVALID_CLIENT_SECRET: 'Client secret cannot be validated. Click ‘regenerate’',
  INVALID_API_SECRET: 'API secret cannot be validated. Click ‘regenerate’',
  MISSING_RESPONSE_TYPE: 'Select at least 1 response type',
  RESPONSE_TYPE_TOKEN_ERROR: 'Select more than 1 response type when ‘token’ is selected as a response type',
  NO_CHANGES_MADE: 'No changes have been made',
  INVALID_HOME_PROTOCOL: 'Enter a home URL in the correct format. The URL must follow http or https protocols only ',
  INVALID_HOME_LENTGH: 'Home URL must be 200 characters or less ',
  INVALID_HOME_CHARACTERS: 'Enter a home URL in the correct format. The URL must not include spaces or the following characters " < > # % { } | \\ ^ ~ [ ] ` ',
  INVALID_REDIRECT_PROTOCOL: 'Enter a redirect URL in the correct format. The URL must follow http or https protocols only ',
  INVALID_REDIRECT_LENTGH: 'Redirect URL must be 200 characters or less ',
  INVALID_REDIRECT_CHARACTERS: 'Enter a redirect URL in the correct format. The URL must not include spaces or the following characters " < > # % { } | \\ ^ ~ [ ] ` ',
  INVALID_RESETPASS_PROTOCOL: 'Enter a post password-reset URL in the correct format. The URL must follow http or https protocols only ',
  INVALID_RESETPASS_LENTGH: 'Post password-reset URL must be 200 characters or less ',
  INVALID_RESETPASS_CHARACTERS: 'Enter a post password-reset URL in the correct format. The URL must not include spaces or the following characters " < > # % { } | \\ ^ ~ [ ] ` ',
  INVALID_LOGOUT_REDIRECT_PROTOCOL: 'Enter a logout redirect URL in the correct format. The URL must follow http or https protocols only ',
  INVALID_LOGOUT_REDIRECT_LENTGH: 'Logout redirect URL must be 200 characters or less ',
  INVALID_LOGOUT_REDIRECT_CHARACTERS: 'Enter a logout redirect URL in the correct format. The URL must not include spaces or the following characters " < > # % { } | \\ ^ ~ [ ] ` ',
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
  clientId: {
    title: 'Client ID',
    description: 'A unique identifier of the service that is created manually by the DfE Sign-in team.',
    changeLink: `${amendChangesBaseUrl}#clientId-form-group`,
    displayOrder: 3,
  },
  redirectUris: {
    title: 'Redirect URL',
    description: 'Where you want to redirect users after they have authenticated.',
    changeLink: `${amendChangesBaseUrl}#redirect_uris-form-group`,
    displayOrder: 4,
  },
  postLogoutRedirectUris: {
    title: 'Logout redirect URL',
    description: 'Where you want to redirect users after they log out of a service.',
    changeLink: `${amendChangesBaseUrl}#post_logout_redirect_uris-form-group`,
    displayOrder: 5,
  },
  responseTypes: {
    title: 'Response types',
    description: 'A value that determines the authentication flow.',
    changeLink: `${amendChangesBaseUrl}#response_types-form-group`,
    displayOrder: 6,
  },
  refreshToken: {
    title: 'Refresh token',
    description: 'Select this field if you want to get new access tokens when they have expired without interaction with the user.',
    changeLink: `${amendChangesBaseUrl}#refresh_token-form-group`,
    displayOrder: 7,
  },
  clientSecret: {
    title: 'Client secret',
    description: 'A value that is created automatically by the system and acts as a password for the service.',
    changeLink: `${amendChangesBaseUrl}#clientSecret-form-group`,
    displayOrder: 8,
  },
  tokenEndpointAuthMethod: {
    title: 'Token endpoint authentication method',
    description: 'The way your service authenticates to the DfE Sign-in token endpoint. Select the method that applies.',
    changeLink: `${amendChangesBaseUrl}#tokenEndpointAuthMethod-form-group`,
    displayOrder: 9,
  },

  apiSecret: {
    title: 'API secret',
    description: 'A value that is created automatically by the system and acts as a password for the DfE Sign-in public API.',
    changeLink: `${amendChangesBaseUrl}#apiSecret-form-group`,
    displayOrder: 10,
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
