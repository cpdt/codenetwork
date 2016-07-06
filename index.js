const co = require('co');
const MongoClient = require('mongodb').MongoClient;

const koa = require('koa');
const serve = require('koa-static');
const compress = require('koa-compress');
const router = require('koa-router')();
const debug = require('debug');
const initDebug = debug('cn:init');
const recDebug = debug('cn:rec');
const warnDebug = debug('cn:warn');

const config = require('./config');
const PagePartial = require('./PagePartial');

if (config.env === 'development') warnDebug('Running in development mode - pages & partials will not be cached.');

const app = koa();
const port = process.env.PORT || config.port || 3000;

let viewCache = new Map();

co(function*() {
    let db = yield MongoClient.connect(config.dburl);
    initDebug('connected to ' + config.dburl);

    function routeView(view) {
        if (!viewCache.has(view)) viewCache.set(view, new PagePartial(view, db));
        let partial = viewCache.get(view);

        return function*(next) {
            recDebug(this.request.url + ' -> ' + view);
            yield partial.requested(this);
        }
    }

    let errRoute = routeView('404');
    app.use(function*(next) {
        yield next;
        if (this.response.status === 404) yield errRoute.call(this, next);
    });

    app.use(compress());
    app.use(router.routes()).use(router.allowedMethods());
    app.use(serve('public', {
        maxage: 30*24*60*60*1000
    }));

    // add routes
    router.get('/', routeView('index'));
    router.get('/login', routeView('login'));
    router.get('/admin', routeView('admin'));

    yield Array.from(viewCache.values()).map(partial => partial.init());
    app.listen(port);
    initDebug('listening on port ' + port);
}).catch(function(err) {
    console.error(err.stack);
});