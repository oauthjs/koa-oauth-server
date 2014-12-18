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
