
/**
 * Module dependencies.
 */

var bodyParser = require('koa-body-parser');
var koa = require('koa');
var oauthServer = require('oauth2-server');

// Create an Express application.
var app = koa();

// Add body parser.
app.use(bodyParser());

// Add OAuth server.
app.oauth = oauthServer({
  model: require('./model')
});

// Post token.
app.post('/oauth/token', app.oauth.token());

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
