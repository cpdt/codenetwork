const path = require('path');
const util = require('util');
const co = require('co');
const trea = require('trea');

const partials = require('../');

const EJSPartial = trea.EJSPartial;

function AdminEventsPartial(param, db) {
    EJSPartial.call(this);

    this.path = path.join(__dirname, 'template.ejs');
    this.partials = partials;
    this.db = db;

    this.cacheCollection = db.collection('cache');
    this.eventsCollection = db.collection('events');
}
util.inherits(AdminEventsPartial, EJSPartial);

AdminEventsPartial.prototype._needsUpdate = co.wrap(function*(since) {
    let latestUpdate = yield this.cacheCollection.find({ key: { $eq: 'events' } }).limit(1).next();
    if (latestUpdate) return latestUpdate > since;
    return true;
});

AdminEventsPartial.prototype._generate = co.wrap(function*(partial, p) {
    return EJSPartial.prototype._generate.call(this, partial, {
        events: yield this.eventsCollection.find().sort({ priority: 1 }).toArray(),
        params: p.params
    });
});

module.exports = AdminEventsPartial;