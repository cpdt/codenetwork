const path = require('path');
const util = require('util');
const co = require('co');
const trea = require('trea');
const partials = require('../');

const EJSPartial = trea.EJSPartial;

function ActivityPartial(db) {
    EJSPartial.call(this);

    this.path = path.join(__dirname, 'template.ejs');
    this.partials = partials;
    this.db = db;
}
util.inherits(ActivityPartial, EJSPartial);

/*EventsPartial.prototype._needsUpdate = co.wrap(function*(since) {
    return false;
});*/

/*EventsPartial.prototype._generate = co.wrap(function*() {
    return EJSPartial.prototype._generate.call(this, { events });
});*/

module.exports = ActivityPartial;