
/**
 * Module dependencies.
 */

var pgp = require('pg-promise')({
    // initialization options
});

var db = pgp(process.env.DATABASE_URL);

/*
 * Get access token.
 */

module.exports.getAccessToken = function *(bearerToken) {
    var token = yield db.one('SELECT access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id FROM oauth_tokens WHERE access_token = $1', [bearerToken]);
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
    var oAuthClient = yield db.oneOrNone('SELECT client_id, client_secret, redirect_uri FROM oauth_clients WHERE client_id = $1 AND client_secret = $2', [clientId, clientSecret]);

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
    var tokens = yield db.any('SELECT access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id FROM oauth_tokens WHERE refresh_token = $1', [bearerToken]);
    return tokens.length?tokens[0]:false;
};

/*
 * Get user.
 */

module.exports.getUser = function *(username, password) {
    var users = yield db.any('SELECT id FROM users WHERE username = $1 AND password = $2', [username, password]);
    return users.length?users[0]:false;
};

/**
 * Save token.
 */

module.exports.saveAccessToken = function *(token, client, user) {
    yield pg.none('INSERT INTO oauth_tokens(access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id) VALUES ($1, $2, $3, $4)', [
        token.accessToken,
        token.accessTokenExpiresOn,
        client.id,
        token.refreshToken,
        token.refreshTokenExpiresOn,
        user.id
    ]);

    // none gets you no results, as you do not return anything.
    //return result.rowCount ? result.rows[0] : false;
};
