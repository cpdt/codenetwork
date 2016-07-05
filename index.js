'use strict';

const fs = require('fs');
const path = require('path');
const co = require('co');
const MongoClient = require('mongodb').MongoClient;
const koa = require('koa');
const serve = require('koa-static');
const compress = require('koa-compress');
const router = require('koa-router')();
const debug = require('debug')('cn:init');

const config = require('./config');
const partials = require('./partials');
const NonStaticPage = require('./NonStaticPage');

const app = koa();
const port = process.env.PORT || 3000;

app.use(compress());
app.use(router.routes()).use(router.allowedMethods());
app.use(serve('public', {
    maxage: 30*24*60*60*1000,
    defer: true
}));

co(function *() {
    let db = yield MongoClient.connect(config.dburl);
    debug('connected to ' + config.dburl);

    // initialize partials
    let partialData = yield partials.map(function(partial) {
        debug('initializing ' + partial[0]);
        return Promise.resolve(partial[1](db)).then(api => [partial[0], api]);
    });

    let partialObj = {};
    for (var partial of partialData) {
        partialObj[partial[0]] = partial[1];
    }

    debug('partial init complete');

    // find all declared views
    const viewFolder = path.join(__dirname, 'views');
    let dir = fs.readdirSync(viewFolder);
    for (let file of dir) {
        let fullPath = path.join(viewFolder, file);
        if (!fs.statSync(fullPath).isFile()) continue;
        let routeName = path.parse(fullPath).name;
        if (routeName === 'index') routeName = '';

        let page = new NonStaticPage(fullPath, routeName, partialObj);
        router.get('/' + routeName, function *(next) {
            yield page.request(this);
        });
    }

    app.listen(port);
    debug('listening on port ' + port);
}).catch(function(err) {
    console.log(err.stack);
});