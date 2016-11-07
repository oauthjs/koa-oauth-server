
/**
 * Module dependencies.
 */

var KoaOAuthServer = require('../../');
var Request = require('oauth2-server').Request;
var Response = require('oauth2-server').Response;
var Koa = require('koa');
var request = require('supertest');
var sinon = require('sinon');
var Promise = require('bluebird');

/**
 * Test `KoaOAuthServer`.
 */

describe('KoaOAuthServer', function() {
  var app;

  beforeEach(function() {
    app = new Koa();
  });

  describe('authenticate()', function() {
    it('should call `authenticate()`', function (done) {
      var oauth = new KoaOAuthServer({ model: {} });

      sinon.stub(oauth.server, 'authenticate').callsArg(3);

      app.use(oauth.authenticate());

      request(app.listen())
        .get('/')
        .end(function (err) {
          oauth.server.authenticate.callCount.should.equal(1);
          oauth.server.authenticate.firstCall.args.should.have.length(4);
          oauth.server.authenticate.firstCall.args[0].should.be.an.instanceOf(Request);
          oauth.server.authenticate.firstCall.args[3].should.be.an.instanceOf(Function);
          oauth.server.authenticate.restore();
          done();
        });

    });
  });

  describe('authorize()', function() {
    it('should call `authorize()`', function (done) {
      var oauth = new KoaOAuthServer({ model: {} });

      sinon.stub(oauth.server, 'authorize').callsArg(3);

      app.use(oauth.authorize());

      request(app.listen())
        .get('/')
        .end(function () {
          oauth.server.authorize.callCount.should.equal(1);
          oauth.server.authorize.firstCall.args.should.have.length(4);
          oauth.server.authorize.firstCall.args[0].should.be.an.instanceOf(Request);
          oauth.server.authorize.firstCall.args[1].should.be.an.instanceOf(Response);
          oauth.server.authorize.firstCall.args[3].should.be.an.instanceOf(Function);
          oauth.server.authorize.restore();
          done();
        });

    });
  });

  describe('token()', function() {
    it('should call `token()`', function (done) {
      var oauth = new KoaOAuthServer({ model: {} });

      sinon.stub(oauth.server, 'token').callsArg(3);
      
      app.use(oauth.token());

      request(app.listen())
        .get('/')
        .end(function () {
          oauth.server.token.callCount.should.equal(1);
          oauth.server.token.firstCall.args.should.have.length(4);
          oauth.server.token.firstCall.args[0].should.be.an.instanceOf(Request);
          oauth.server.token.firstCall.args[1].should.be.an.instanceOf(Response);
          oauth.server.token.firstCall.args[3].should.be.an.instanceOf(Function);
          oauth.server.token.restore();
          done();
        });

    });
  });
});
