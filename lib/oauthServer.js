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

var NodeOAuthServer = require('node-oauth2-server');
var parse = require('co-body');

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
  var expressAuthorise = this.server.authorise();

  // Authorise thunk
  var authorise = function (req, res) {
    return function (cb) {
      expressAuthorise(req, res, cb);
    };
  };

  return function *(next) {
    if (this.request.is('application/json'))
      this.request.body = yield parse.json(this.request);

    if (this.request.is('application/x-www-form-urlencoded'))
      this.request.body = yield parse.form(this.request);

    try {
      yield authorise(this.request, this.response);
    } catch (err) {
      return handleError(err, self.server, this);
    }

    yield next;
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
  var expressGrant = this.server.grant();

  // Grant thunk
  var grant = function (req, res) {
    return function (cb) {
      expressGrant(req, res, cb);
    };
  };

  return function *(next) {
    if (this.request.is('application/json'))
      this.request.body = yield parse.json(this.request);

    if (this.request.is('application/x-www-form-urlencoded'))
      this.request.body = yield parse.form(this.request);

    // Mock the jsonp method
    this.response.jsonp = function (body) {
      this.body = JSON.stringify(body);
    };

    try {
      yield grant(this.request, this.response);
    } catch (err) {
      return handleError(err, self.server, this);
    }

    yield next;
  };
};

/**
 * OAuth Error handler
 *
 * @return {Function} middleware
 */
var handleError = function (err, server, ctx) {
  if (!server.passthroughErrors) {
    ctx.type = 'json';
    ctx.status = err.code;
    ctx.body = {};
    for (var key in err) {
      if (key !== 'stack')
        ctx.body[key] = err[key];
    }
  }

  err.type = 'oauth';

  return ctx.app.emit('error', err, ctx);
};
