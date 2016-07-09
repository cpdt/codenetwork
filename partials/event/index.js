const path = require('path');
const util = require('util');
const co = require('co');
const trea = require('trea');

const partials = require('../');

const EJSPartial = trea.EJSPartial;

function EventPartial(param, db) {
    EJSPartial.call(this);

    this.path = path.join(__dirname, 'template.ejs');
    this.partials = partials;
    this.db = db;

    this.eventsCollection = db.collection('events');
}
util.inherits(EventPartial, EJSPartial);

EventPartial.prototype._needsUpdate = co.wrap(function*(since, p) {
    let event = yield this.eventsCollection.find({ slug: { $eq: p.params.id } }).limit(1).next();
    if (!event) return true;
    return event.updateTime > since;
});

EventPartial.prototype._generate = co.wrap(function*(partial, p) {
    let event = yield this.eventsCollection.find({ slug: { $eq: p.params.id } }).limit(1).next();
    if (!event) return 'Oops'; // todo

    // parse actions
    let actions = [];
    if (event.actions.length) {
        actions = event.actions.split('\n').map(action => {
            let [icon, link, text] = action.split(', ', 3);
            return {icon, link, text};
        });
    }

    return EJSPartial.prototype._generate.call(this, partial, {
        event,
        actions,
        params: p.params
    });
});

module.exports = EventPartial;