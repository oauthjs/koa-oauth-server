# Koa OAuth Server [![Build Status](https://travis-ci.org/thomseddon/koa-oauth-server.png?branch=master)](https://travis-ci.org/thomseddon/koa-oauth-server)

Complete, compliant and well tested module for implementing an OAuth2 Server/Provider with [koa](https://github.com/koajs/koa) in [node.js](http://nodejs.org/).

This is the koa wrapper for [oauth2-server](https://github.com/thomseddon/node-oauth2-server).

## Installation

    $ npm install koa-oauth-server

## Quick Start

The module provides two middlewares - one for granting tokens and another to authorise them. `koa-oauth-server` and, consequently `oauth2-server`, expect the request body to be parsed already.
The following example uses `koa-bodyparser` but you may opt for an alternative library.

```js
var koa = require('koa');
var bodyparser = require('koa-bodyparser');
var oauthserver = require('koa-oauth-server');

var app = koa();

app.oauth = oauthserver({
  model: {}, // See https://github.com/thomseddon/node-oauth2-server for specification
  grants: ['password'],
  debug: true
});

app.use(bodyparser());
app.use(app.oauth.authorise());

app.use(function *(next) {
  this.body = 'Secret area';
  yield next;
});

app.listen(3000);
```

### Using `koa-router` with `koa-mount`

If you wish to integrate with `koa-router` using `koa-mount`, you may do so by combining them to mount a specific prefix for oauth operations:

```js
var Router = require('koa-router');
var bodyparser = require('koa-bodyparser');
var koa = require('koa');
var model = require('koa-oauth-server/node_modules/oauth2-server/examples/memory/model');
var mount = require('koa-mount');
var oauthserver = require('koa-oauth-server');

// Create a new koa app.
var app = koa();

// Create a router for oauth.
var router = new Router();

// Enable body parsing.
app.use(bodyparser());

// See https://github.com/thomseddon/node-oauth2-server for specification.
app.oauth = oauthserver({
  model: model,
  grants: ['password'],
  debug: true
});

// Mount `oauth2` route prefix.
app.use(mount('/oauth2', router.middleware()));

// Register `/token` POST path on oauth router (i.e. `/oauth2/token`).
router.post('/token', app.oauth.grant());

// Start koa server.
app.listen(3000);
```

Then attempt to be granted a new oauth token:

```sh
curl -XPOST -d 'username=thomseddon&password=nightworld&grant_type=password&client_id=thom&client_secret=nightworld' http://localhost:3000/oauth2/token
```
