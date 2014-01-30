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
  var authorise = this.server.authorise();

  // Authorise thunk
  var auth = function (req, res) {
    return function (cb) {
      authorise(req, res, cb);
    };
  };

  return function *(next) {
    // Parse body
    if (this.request.is('application/json'))
      this.request.body = yield parse.json(this.request);

    if (this.request.is('application/x-www-form-urlencoded'))
      this.request.body = yield parse.form(this.request);

    try {
      yield auth(this.request, this.response);
    } catch (err) {
      if (!this.passthroughErrors)
        return handleError(err, this);
    }

    yield next;
  };
};

/**
 * Grant Middleware
 *
 * Returns middleware that will grant an OAuth token
 *
 * @return {Function} middleware
 */
OAuthServer.prototype.grant = function () {

  var self = this;
  var expressCompatibleGrant = this.server.grant();

  // Grant thunk (koa-compatible)
  var grant = function (req, res) {
    return function (cb) {
      expressCompatibleGrant(req, res, cb);
    };
  };

  return function *(next) {
    // Parse body
    if (this.request.is('application/json'))
      this.request.body = yield parse.json(this.request);

    if (this.request.is('application/x-www-form-urlencoded'))
      this.request.body = yield parse.form(this.request);

    try {
      yield grant(this.request, expressCompatibleResponseFromKoaContext(this));
    } catch (err) {
      if (!this.passthroughErrors)
        return handleError(err, this);
    }

    yield next;
  };
};

var expressCompatibleResponseFromKoaContext = function (context) {
  return {
    jsonp: function (response) {
      context.body = response;
    }
  }
};

/**
 * OAuth Error handler
 *
 * @return {Function} middleware
 */
var handleError = function (err, ctx) {
  if (ctx.debug) console.log(err.stack || err);

  delete err.stack;

  ctx.type = 'json';
  ctx.status = err.code;
  ctx.body = err;
  return ctx.app.emit('error', err, ctx);
};
