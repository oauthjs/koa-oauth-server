
/**
 * Module dependencies.
 */

var InvalidArgumentError = require('oauth2-server/lib/errors/invalid-argument-error');
var UnauthorizedRequestError = require('oauth2-server/lib/errors/unauthorized-request-error');
var NodeOAuthServer = require('oauth2-server');
var Request = require('oauth2-server').Request;
var Response = require('oauth2-server').Response;
var Promise = require('bluebird');

/**
 * Constructor.
 */

function KoaOAuthServer(options) {
  options = options || {};

  if (!options.model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  this.server = new NodeOAuthServer(options);
}

/**
 * Authentication Middleware.
 *
 * Returns a middleware that will validate a token.
 *
 * (See: https://tools.ietf.org/html/rfc6749#section-7)
 */

KoaOAuthServer.prototype.authenticate = function() {
  var server = this.server;

  return function (ctx, next) {
    var request = new Request(ctx.request);
    var response = new Response(ctx.response);
    var authenticate = Promise.promisify(server.authenticate, { context: server });

    // pass `null` for 3rd argument as NodeOAuthServer#authenticate expects callback as 4th argument
    return authenticate(request, response, null)
      .then(function (token) {
        ctx.state.oauth = {
          token: token
        };
        handleResponse.call(ctx, response);
      })
      .catch(function (err) {
        handleError.call(ctx, err, response);
      })
      .finally(function () {
        return next();
      });
  };
};

/**
 * Authorization Middleware.
 *
 * Returns a middleware that will authorize a client to request tokens.
 *
 * (See: https://tools.ietf.org/html/rfc6749#section-3.1)
 */

KoaOAuthServer.prototype.authorize = function() {
  var server = this.server;

  return function (ctx, next) {
    var request = new Request(ctx.request);
    var response = new Response(ctx.response);
    var authorize = Promise.promisify(server.authorize, { context: server });

    // pass `null` for 3rd argument as NodeOAuthServer#authorize expects callback as 4th argument
    return authorize(request, response, null)
      .then(function (code) {
        ctx.state.oauth = {
          code: code
        };
        handleResponse.call(ctx, response);
      })
      .catch(function (err) {
        handleError.call(ctx, err, response);
      })
      .finally(function () {
        return next();
      });
  };
};

/**
 * Grant Middleware
 *
 * Returns middleware that will grant tokens to valid requests.
 *
 * (See: https://tools.ietf.org/html/rfc6749#section-3.2)
 */

KoaOAuthServer.prototype.token = function() {
  var server = this.server;

  return function (ctx, next) {
    var request = new Request(ctx.request);
    var response = new Response(ctx.response);
    var token = Promise.promisify(server.token, { context: server });

    // pass `null` for 3rd argument as NodeOAuthServer#token expects callback as 4th argument
    return token(request, response, null)
      .then(function (token) {
        ctx.state.oauth = {
          token: token
        };
        handleResponse.call(ctx, response);
      })
      .catch(function (err) {
        handleError.call(ctx, err, response);
      })
      .finally(function () {
        return next();
      });
  };
};

/**
 * Handle response.
 */

var handleResponse = function(response) {
  this.body = response.body;
  this.status = response.status;

  this.set(response.headers);
};

/**
 * Handle error.
 */

var handleError = function(e, response) {

  if (response) {
    this.set(response.headers);
  }

  if (e instanceof UnauthorizedRequestError) {
    this.status = e.code;
  } else {
    this.body = { error: e.name, error_description: e.message };
    this.status = e.code;
  }

  return this.app.emit('error', e, this);
};

/**
 * Export constructor.
 */

module.exports = KoaOAuthServer;
