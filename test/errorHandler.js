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
  bodyparser = require('koa-bodyparser'),
  request = require('supertest'),
  should = require('should');

var oauthServer = require('../');

var bootstrap = function (oauthConfig) {
  oauthConfig = oauthConfig || { model: {} };

  var app = koa();
  app.oauth = oauthServer(oauthConfig);

  // Error handling middleware must be added
  // before all the others
  if (oauthConfig.passthroughErrors === true) {
    app.use(function *(next) {
      try {
        yield next;
      } catch (e) {
        this.body = 'Caught OAuth exception';
      }
    });
  }

  return app;
};

var bootstrapGrant = function (oauthConfig) {
  var app = bootstrap(oauthConfig);

  app.use(bodyparser());
  app.use(app.oauth.grant());

  return app;
};

var bootstrapAuthorise = function (oauthConfig) {
  var app = bootstrap(oauthConfig);

  app.use(bodyparser());
  app.use(app.oauth.authorise());

  return app;
};

describe('Error Handler', function () {
  it('should return an oauth conformat response', function (done) {
    var app = bootstrapAuthorise();

    request(app.listen())
      .get('/')
      .expect(400)
      .end(function (err, res) {
        if (err) return done(err);

        res.body.should.have.keys('code', 'error', 'error_description');

        res.body.code.should.be.a.Number;
        res.body.code.should.equal(res.statusCode);

        res.body.error.should.be.a.String;

        res.body.error_description.should.be.a.String;

        done();
      });
  });

  it('should passthrough grant errors', function (done) {
    var app = bootstrapGrant({
      passthroughErrors: true,
      model: {}
    });

    request(app.listen())
      .get('/')
      .expect('Caught OAuth exception', done);
  });

  it('should passthrough authorise errors', function (done) {
    var app = bootstrapAuthorise({
      passthroughErrors: true,
      model: {}
    });

    request(app.listen())
      .get('/')
      .expect('Caught OAuth exception', done);
  });
});
