
/**
 * Module dependencies.
 */

var pg = require('pg-promise')(process.env.DATABASE_URL);

/*
 * Get access token.
 */

module.exports.getAccessToken = function *(bearerToken) {
  var result = yield pg.query('SELECT access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id FROM oauth_tokens WHERE access_token = $1', [bearerToken]);
  var token = result.rows[0];

  return {
    accessToken: token.access_token,
    clientId: token.client_id,
    expires: token.expires,
    userId: token.userId
  };
};

/**
 * Get client.
 */

module.exports.getClient = function *(clientId, clientSecret) {
  var result = yield pg.query('SELECT client_id, client_secret, redirect_uri FROM oauth_clients WHERE client_id = $1 AND client_secret = $2', [clientId, clientSecret]);
  var oAuthClient = result.rows[0];

  if (!oAuthClient) {
    return;
  }

  return {
    clientId: oAuthClient.client_id,
    clientSecret: oAuthClient.client_secret
  };
};

/**
 * Get refresh token.
 */

module.exports.getRefreshToken = function *(bearerToken) {
  var result = yield pg.query('SELECT access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id FROM oauth_tokens WHERE refresh_token = $1', [bearerToken]);

  return result.rowCount ? result.rows[0] : false;
};

/*
 * Get user.
 */

module.exports.getUser = function *(username, password) {
  var result = yield pg.query('SELECT id FROM users WHERE username = $1 AND password = $2', [username, password]);

  return result.rowCount ? result.rows[0] : false;
};

/**
 * Save token.
 */

module.exports.saveAccessToken = function *(token, client, user) {
  var result = yield pg.query('INSERT INTO oauth_tokens(access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id) VALUES ($1, $2, $3, $4)', [
    token.accessToken,
    token.accessTokenExpiresOn,
    client.id,
    token.refreshToken,
    token.refreshTokenExpiresOn,
    user.id
  ]);

  return result.rowCount ? result.rows[0] : false;
};
