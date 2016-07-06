const path = require('path');
const util = require('util');
const co = require('co');
const trea = require('trea');

const config = require('../../config');
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
    let latestRecord = yield this.eventsCollection.find().limit(1).sort({$natural: -1}).next();
    let latestUpdate = latestRecord._id.getTimestamp();
    return latestUpdate > since;
});

EventsPartial.prototype._generate = co.wrap(function*() {
    let fetchCount = (yield this.configCollection.find({
        key: { $eq: 'eventDisplayCount' }
    }).limit(1).next()).value || 3;
    let events = yield this.eventsCollection.find().limit(fetchCount).sort({ $natural: -1 }).toArray();

    let bigEvents = [], smallEvents = [];
    for (let event of events) {
        (event.isBig ? bigEvents : smallEvents).push(event);
    }

    let newEvents = [];

    if (!bigEvents.length) {
        while (smallEvents.length) {
            if (smallEvents.length > 1) {
                newEvents.push({
                    type: 'double',
                    items: [ smallEvents.shift(), smallEvents.shift() ]
                });
            } else newEvents.push({ type: 'single', item: smallEvents.shift() });
        }
    }
    else if (!smallEvents.length) newEvents = bigEvents.map(e => ({ type: 'single', item: e }));
    else {
        // small events are in rows of two
        let smallRowCount = smallEvents.length / 2;

        // find how many big events we should have per small row.
        // if this is > 1, it is how many should be grouped together. if < 1, it is 1 / (how many should be skilled
        // before each big one)
        let smallsPerBig = bigEvents.length / smallRowCount;
        let smallGroupAmount = Math.max(1, Math.round(1 / smallsPerBig));
        let bigGroupAmount = Math.max(1, Math.round(smallsPerBig) - 1);

        while (bigEvents.length || smallEvents.length) {
            for (let i = 0; i < bigGroupAmount && bigEvents.length; i++) {
                newEvents.push({ type: 'single', item: bigEvents.shift() });
            }
            for (let i = 0; i < smallGroupAmount && smallEvents.length; i++) {
                if (smallEvents.length > 1) {
                    newEvents.push({
                        type: 'double',
                        items: [ smallEvents.shift(), smallEvents.shift() ]
                    });
                } else newEvents.push({ type: 'single', item: smallEvents.shift() });
            }
        }
    }

    return EJSPartial.prototype._generate.call(this, { events: newEvents });
});

module.exports = EventsPartial;