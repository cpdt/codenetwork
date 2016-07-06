const path = require('path');
const util = require('util');
const co = require('co');
const trea = require('trea');
const partials = require('../');

const EJSPartial = trea.EJSPartial;

function EventsPartial(db) {
    EJSPartial.call(this);
    
    this.path = path.join(__dirname, 'template.ejs');
    this.partials = partials;
    this.db = db;
    
    this.configCollection = db.collection('config');
    this.eventsCollection = db.collection('events');
}
util.inherits(EventsPartial, EJSPartial);

EventsPartial.prototype._needsUpdate = co.wrap(function*(since) {
    let latestRecord = yield this.eventsCollection.find().limit(1).sort({ $natural: -1 }).next();
    let latestUpdate = latestRecord._id.getTimestamp();
    return latestUpdate > since;
});

EventsPartial.prototype._generate = co.wrap(function*() {
    let fetchCount = (yield this.configCollection.find({
        key: { $eq: 'eventDisplayCount' }
    }).limit(1).next()).value || 3;
    let events = yield this.eventsCollection.find().limit(fetchCount).sort({ $natural: -1 }).toArray();
    
    return EJSPartial.prototype._generate.call(this, { events });
});

module.exports = EventsPartial;