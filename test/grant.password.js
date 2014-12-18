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

var koa = require('koa'),
  bodyparser = require('koa-bodyparser'),
  request = require('supertest'),
  should = require('should');

var oauth2server = require('../');

var bootstrap = function (oauthConfig) {
  oauthConfig = oauthConfig || {
    model: {},
    grants: ['password', 'refresh_token']
  };

  var app = koa();
  app.oauth = oauth2server(oauthConfig);

  app.use(bodyparser());
  app.use(app.oauth.grant());

  return app;
};

describe('Granting with password grant type', function () {
  it('should detect missing parameters', function (done) {
    var app = bootstrap({
      model: {
        getClient: function (id, secret, callback) {
          callback(false, true);
        },
        grantTypeAllowed: function (clientId, grantType, callback) {
          callback(false, true);
        }
      },
      grants: ['password']
    });

    request(app.listen())
      .post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'password',
        client_id: 'thom',
        client_secret: 'nightworld'
      })
      .expect('WWW-Authenticate', 'Basic realm="Service"')
      .expect(400, /missing parameters. \\"username\\" and \\"password\\"/i, done);
  });

  it('should detect invalid user', function (done) {
    var app = bootstrap({
      model: {
        getClient: function (id, secret, callback) {
          callback(false, true);
        },
        grantTypeAllowed: function (clientId, grantType, callback) {
          callback(false, true);
        },
        getUser: function (uname, pword, callback) {
          uname.should.equal('thomseddon');
          pword.should.equal('nightworld');
          callback(false, false); // Fake invalid user
        }
      },
      grants: ['password']
    });

    request(app.listen())
      .post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        grant_type: 'password',
        client_id: 'thom',
        client_secret: 'nightworld',
        username: 'thomseddon',
        password: 'nightworld'
      })
      .expect(400, /user credentials are invalid/i, done);
  });
});
