
/**
 * Module dependencies.
 */

var bodyParser = require('koa-bodyparser');
var koa = require('koa');
var oauthServer = require('oauth2-server');
var render = require('co-views')('views');
var util = require('util');

// Create a Koa application.
var app = koa();

// Add body parser.
app.use(bodyParser());

// Add OAuth server.
app.oauth = oauthServer({
  debug: true,
  model: require('./model')
});

// Post token.
app.post('/oauth/token', app.oauth.token());

// Get authorization.
app.get('/oauth/authorize', function *() {
  // Redirect anonymous users to login page.
  if (!this.state.user) {
    return this.redirect(util.format('/login?redirect=%s&client_id=%s&redirect_uri=%s', this.request.path, this.request.query.client_id, this.request.query.redirect_uri));
  }

  yield render('authorize', {
    client_id: this.request.query.client_id,
    redirect_uri: this.request.query.redirect_uri
  });
});

// Post authorization.
app.post('/oauth/authorize', function *() {
  // Redirect anonymous users to login page.
  if (!this.state.user) {
    return this.redirect(util.format('/login?client_id=%s&redirect_uri=%s', this.request.query.client_id, this.request.query.redirect_uri));
  }

  yield app.oauth.authorize();
});

// Get login.
app.get('/login', function *() {
  yield render('login', {
    redirect: this.request.query.redirect,
    client_id: this.request.query.client_id,
    redirect_uri: this.request.query.redirect_uri
  });
});

// Post login.
app.post('/login', function *() {
  // @TODO: Insert your own login mechanism.
  if (this.request.body.email !== 'thom@nightworld.com') {
    return yield render('login', {
      redirect: this.request.body.redirect,
      client_id: this.request.body.client_id,
      redirect_uri: this.request.body.redirect_uri
    });
  }

  // Successful logins should send the user back to /oauth/authorize.
  var path = this.request.body.redirect || '/home';

  return this.redirect(util.format('/%s?client_id=%s&redirect_uri=%s', path, this.request.query.client_id, this.request.query.redirect_uri));
});

// Get secret.
app.get('/secret', app.oauth.authorize(), function *() {
  // Will require a valid access_token.
  this.body = 'Secret area';
});

app.get('/public', function *() {
  // Does not require an access_token.
  this.body = 'Public area';
});

// Start listening for requests.
app.listen(3000);
