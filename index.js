/**
 * Copyright 2013-present Thom Seddon.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var NodeOAuthServer = require('oauth2-server');
var thenify = require('thenify');

module.exports = OAuthServer;

/**
 * Constructor
 *
 * @param {Object} config Configuration object
 */
function OAuthServer (config) {
  if (!(this instanceof OAuthServer)) return new OAuthServer(config);

  config.continueAfterResponse = true;
  this.server = new NodeOAuthServer(config);
}

/**
 * Authorisation Middleware
 *
 * Returns middleware that will authorise the request using oauth,
 * if successful it will allow the request to proceed to the next handler
 *
 * @return {Function} middleware
 */
OAuthServer.prototype.authorise = function () {

  var self = this;
  var expressAuthorise = thenify(this.server.authorise());

  return function *authorise(next) {
    try {
      yield expressAuthorise(this.request, this.response);
    } catch (err) {
      if (self.server.passthroughErrors)
        throw err;

      return handleError(err, self.server, this);
    }

    yield *next;
  };
};

/**
 * Grant Middleware
 *
 * Returns middleware that will grant tokens to valid requests.
 * This would normally be mounted at '/oauth/token'
 *
 * @return {Function} middleware
 */
OAuthServer.prototype.grant = function () {

  var self = this;
  var expressGrant = thenify(this.server.grant());

  return function *grant(next) {
    // Mock the jsonp method
    this.response.jsonp = function (body) {
      this.body = body;
    };

    try {
      yield expressGrant(this.request, this.response);
    } catch (err) {
      if (self.server.passthroughErrors)
        throw err;

      return handleError(err, self.server, this);
    }

    yield *next;
  };
};

/**
 * OAuth Error handler
 *
 * @return {Function} middleware
 */
var handleError = function (err, server, ctx) {
  ctx.type = 'json';
  ctx.status = err.code;

  if (err.headers)
    ctx.set(err.headers);

  ctx.body = {};
  ['code', 'error', 'error_description'].forEach(function (key) {
    ctx.body[key] = err[key];
  });

  err.type = 'oauth';

  return ctx.app.emit('error', err, ctx);
};
