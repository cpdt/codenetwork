'use strict';

const koa = require('koa');
const serve = require('koa-static');
const app = koa();

const port = process.env.CODENETWORK_PORT || 3000;

app.use(serve('public'));

app.listen(port);
console.log('Server listening on port ' + port);