const co = require('co');
const MongoClient = require('mongodb').MongoClient;
const path = require('path');

const koa = require('koa');
const serve = require('koa-static');
const compress = require('koa-compress');
const router = require('koa-router')();
const koaBody = require('koa-body');
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
    let db = yield MongoClient.connect("mongodb://" + config.dbuser + ":" + config.dbpass + "@" + config.dburl);
    initDebug('connected to ' + config.dburl);

    function routeView(view) {
        if (!viewCache.has(view)) viewCache.set(view, new PagePartial(view, db));
        let partial = viewCache.get(view);

        return function*() {
            recDebug(this.request.method.toUpperCase() + ' ' + this.request.url + ' -> ' + view);
            yield partial.requested(this);
        }
    }

    function addTo(router, methods, p, ...views) {
        if (!Array.isArray(methods)) methods = [methods];
        for (let method of methods) {
            router[method](p, ...views);
        }
    }

    app.use(compress());
    app.use(router.routes()).use(router.allowedMethods());
    app.use(serve('public', {
        maxage: 30*24*60*60*1000
    }));

    // add routes
    addTo(router, ['get'], '/', routeView('index'));

    // admin pages
    addTo(router, ['get', 'post'], '/admin', koaBody(), routeView('admin'));
    addTo(router, ['get'], '/admin/login', routeView('login'));
    addTo(router, ['get'], '/admin/logout', routeView('logout'));
    addTo(router, ['get', 'post'], '/admin/event/:id', koaBody({
        multipart: true,
        formidable: {
            maxFields: 2,
            uploadDir: path.join(__dirname, 'public/upload'),
            multiples: false,
            keepExtensions: true
        }
    }), routeView('edit-event'));

    addTo(router, ['get'], '/event/:id', routeView('event'));

    let errRoute = routeView('404');
    app.use(function*() {
        if (this.response.status === 404) yield errRoute.call(this);
    });

    yield Array.from(viewCache.values()).map(partial => partial.init());

    app.listen(port);
    initDebug('listening on port ' + port);
}).catch(function(err) {
    console.error(err.stack);
});