const trea = require('trea');
const util = require('util');
const co = require('co');
const path = require('path');

const debugNotModified = require('debug')('cn:304');
const debugOk = require('debug')('cn:200');

const config = require('./config');
const partials = require('./partials');

const EJSPartial = trea.EJSPartial;

const initTime = new Date();

function PagePartial(view, db) {
    EJSPartial.call(this);

    this.name = view;
    this.path = path.join(__dirname, 'views', view + '.ejs');
    this.partials = partials;
    this.db = db;
}
util.inherits(PagePartial, EJSPartial);

PagePartial.prototype.requested = co.wrap(function*(ctx) {
    yield this._doRequested(ctx);
});

PagePartial.prototype._init = co.wrap(function*() {
    return yield EJSPartial.prototype._init.call(this, this.db);
});

PagePartial.prototype._needsUpdate = function(date) {
    return initTime > date;
};

PagePartial.prototype._doRequested = co.wrap(function*(ctx) {
    let param = {
        params: ctx.params,
        method: ctx.request.method
    };

    if (ctx.request.headers['if-modified-since']) {
        let modifiedTime = new Date(ctx.request.headers['if-modified-since']);
        let needsUpdateSince = yield this.needsUpdate(modifiedTime, param);
        
        if (!needsUpdateSince) {
            let genTime = this.genTime(param).toUTCString();
            ctx.response.set('last-modified', genTime);
            ctx.response.status = 304;
            ctx.body = '';
            debugNotModified(this.name + ' - ' + modifiedTime.toUTCString() + ' <= ' + genTime);
            return;
        }
    }

    let rendered = yield this.generate(null, param, ctx, param);
    let genTime = this.genTime(param).toUTCString();
    ctx.response.set('last-modified', genTime);
    ctx.body = rendered;
    debugOk(this.name + ' - generated at ' + genTime);
});

module.exports = PagePartial;