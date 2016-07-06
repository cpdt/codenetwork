const co = require('co');
const MongoClient = require('mongodb').MongoClient;

const koa = require('koa');
const serve = require('koa-static');
const compress = require('koa-compress');
const router = require('koa-router')();
const debug = require('debug')('cn:init');

const config = require('./config');
const PagePartial = require('./PagePartial');

const app = koa();
const port = process.env.PORT || config.port || 3000;

app.use(compress());
app.use(router.routes()).use(router.allowedMethods());
app.use(serve('public', {
    maxage: 30*24*60*60*1000,
    defer: true
}));

let viewCache = new Map();

co(function*() {
    let db = yield MongoClient.connect(config.dburl);
    debug('connected to ' + config.dburl);

    function routeView(route, view) {
        if (!viewCache.has(view)) viewCache.set(view, new PagePartial(view, db));
        let partial = viewCache.get(view);

        router.get(route, function*(next) {
            yield partial.requested(this);
        });
    }

    routeView('/', 'index');

    yield Array.from(viewCache.values()).map(partial => partial.init());
    app.listen(port);
    debug('listening on port ' + port);
}).catch(function(err) {
    console.error(err.stack);
});