/**
 * Copyright 2014-present Thom Seddon.
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
  request = require('supertest'),
  should = require('should');

var oauthServer = require('../');

var bootstrap = function (oauthConfig) {
  if (oauthConfig === 'fakeInvalidToken') {
    oauthConfig = {
      model: {
        getAccessToken: function (token, callback) {
          token.should.equal('thom');
          callback(false, false); // Fake invalid token
        }
      }
    };
  }

  var app = koa();
  app.oauth = oauthServer(oauthConfig || { model: {} });

  app.use(app.oauth.authorise());

  return app;
};

describe('Authorise', function() {

  describe('getBearerToken', function () {
    it('should detect no access token', function (done) {
      var app = bootstrap();

      request(app.listen())
        .get('/')
        .expect(400, /the access token was not found/i, done);
    });

    it('should retrieve access token from header', function (done) {
      var app = bootstrap('fakeInvalidToken');

      request(app.listen())
        .get('/')
        .set('Authorization', 'Bearer thom')
        .expect(401, /the access token provided is invalid/i, done);
    });

    it('should detect malformed header', function (done) {
      var app = bootstrap();

      request(app.listen())
        .get('/')
        .set('Authorization', 'Invalid')
        .expect(400, /malformed auth header/i, done);
    });

    it('should require application/x-www-form-urlencoded when access token is in body',
        function (done) {
      var app = bootstrap('fakeInvalidToken');

      request(app.listen())
        .post('/')
        .send({ access_token: 'thom' })
        .expect(400, /content type must be application\/x-www-form-urlencoded/i, done);
    });

    it('should retrieve access token from body', function (done) {
      var app = bootstrap('fakeInvalidToken');

      request(app.listen())
        .post('/')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({ access_token: 'thom' })
        .expect(401, /the access token provided is invalid/i, done);
    });

    it('should not allow GET when access token in body', function (done) {
      var app = bootstrap();

      request(app.listen())
        .get('/')
        .send({ access_token: 'thom' })
        .expect(400, /method cannot be GET/i, done);
    });

    it('should retrieve token from query parameters', function (done) {
      var app = bootstrap('fakeInvalidToken');

      request(app.listen())
        .get('/?access_token=thom')
        .expect(401, /the access token provided is invalid/i, done);
    });

    it('should allow exactly one method (get: query + auth)', function (done) {
      var app = bootstrap();

      request(app.listen())
        .get('/?access_token=thom')
        .set('Authorization', 'Invalid')
        .expect(400, /only one method may be used/i, done);
    });

    it('should allow exactly one method (post: query + body)', function (done) {
      var app = bootstrap();

      request(app.listen())
        .post('/?access_token=thom')
        .set('Authorization', 'Invalid')
        .expect(400, /only one method may be used/i, done);
    });
  });

  describe('validate access token', function () {

    it('should detect invalid token', function (done){
      var app = bootstrap('fakeInvalidToken');

      request(app.listen())
        .get('/?access_token=thom')
        .expect(401, /the access token provided is invalid/i, done);
    });

    it('should detect invalid token', function (done){
      var app = bootstrap({
        model: {
          getAccessToken: function (token, callback) {
            callback(false, { expires: 0 }); // Fake expires
          }
        }
      });

      request(app.listen())
        .get('/?access_token=thom')
        .expect(401, /the access token provided has expired/i, done);
    });

    it('should passthrough with a valid token', function (done){
      var app = bootstrap({
        model: {
          getAccessToken: function (token, callback) {
            var expires = new Date();
            expires.setSeconds(expires.getSeconds() + 20);
            callback(false, { expires: expires });
          }
        }
      });

      app.use(function *(next) {
        this.body = 'nightworld';
        yield next;
      });

      request(app.listen())
        .get('/?access_token=thom')
        .expect(/nightworld/, 200, done);
    });

    it('should passthrough with valid, non-expiring token (token = null)', function (done) {
      var app = bootstrap({
        model: {
          getAccessToken: function (token, callback) {
            callback(false, { expires: null });
          }
        }
      });

      app.use(function *(next) {
        this.body = 'nightworld';
        yield next;
      });

      request(app.listen())
        .get('/?access_token=thom')
        .expect(/nightworld/, 200, done);
    });
  });

  it('should expose the user_id', function (done) {
    var app = bootstrap({
      model: {
        getAccessToken: function (token, callback) {
          var expires = new Date();
          expires.setSeconds(expires.getSeconds() + 20);
          callback(false, { expires: expires , userId: 1 });
        }
      }
    }, false);


    app.use(function *(next) {
      this.request.should.have.property('user');
      this.request.user.should.have.property('id');
      this.request.user.id.should.equal(1);
      this.body = 'nightworld';
      yield next;
    });

    request(app.listen())
      .get('/?access_token=thom')
      .expect(/nightworld/, 200, done);
  });

});
