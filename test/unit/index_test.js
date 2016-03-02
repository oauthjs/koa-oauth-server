
/**
 * Module dependencies.
 */

var KoaOAuthServer = require('../../');
var Request = require('oauth2-server').Request;
var Response = require('oauth2-server').Response;
var koa = require('koa');
var request = require('co-supertest');
var sinon = require('sinon');

/**
 * Test `KoaOAuthServer`.
 */

describe('KoaOAuthServer', function() {
  var app;

  beforeEach(function() {
    app = koa();
  });

  describe('authenticate()', function() {
    it('should call `authenticate()`', function *() {
      var oauth = new KoaOAuthServer({ model: {} });

      sinon.stub(oauth.server, 'authenticate').returns({});

      app.use(oauth.authenticate());

      yield request(app.listen())
        .get('/')
        .end();

      oauth.server.authenticate.callCount.should.equal(1);
      oauth.server.authenticate.firstCall.args.should.have.length(1);
      oauth.server.authenticate.firstCall.args[0].should.be.an.instanceOf(Request);
      oauth.server.authenticate.restore();
    });
  });

  describe('authorize()', function() {
    it('should call `authorize()`', function *() {
      var oauth = new KoaOAuthServer({ model: {} });

      sinon.stub(oauth.server, 'authorize').returns({});

      app.use(oauth.authorize());

      yield request(app.listen())
        .get('/')
        .end();

      oauth.server.authorize.callCount.should.equal(1);
      oauth.server.authorize.firstCall.args.should.have.length(2);
      oauth.server.authorize.firstCall.args[0].should.be.an.instanceOf(Request);
      oauth.server.authorize.firstCall.args[1].should.be.an.instanceOf(Response);
      oauth.server.authorize.restore();
    });
  });

  describe('token()', function() {
    it('should call `token()`', function *() {
      var oauth = new KoaOAuthServer({ model: {} });

      sinon.stub(oauth.server, 'token').returns({});

      app.use(oauth.token());

      yield request(app.listen())
        .get('/')
        .end();

      oauth.server.token.callCount.should.equal(1);
      oauth.server.token.firstCall.args.should.have.length(2);
      oauth.server.token.firstCall.args[0].should.be.an.instanceOf(Request);
      oauth.server.token.firstCall.args[1].should.be.an.instanceOf(Response);
      oauth.server.token.restore();
    });
  });
});
