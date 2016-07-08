const path = require('path');
const util = require('util');
const co = require('co');
const trea = require('trea');

const config = require('../../config');
const partials = require('../');

const EJSPartial = trea.EJSPartial;

function ActivityPartial(param, db) {
    EJSPartial.call(this);

    this.path = path.join(__dirname, 'template.ejs');
    this.partials = partials;
    this.db = db;

    this.configCollection = db.collection('config');
    this.activityCollection = db.collection('activity');
}
util.inherits(ActivityPartial, EJSPartial);

ActivityPartial.prototype._needsUpdate = co.wrap(function*(since) {
    let latestRecord = yield this.activityCollection.find().limit(1).sort({$natural: -1}).next();
    let latestUpdate = latestRecord._id.getTimestamp();
    return latestUpdate > since;
});

ActivityPartial.prototype._generate = co.wrap(function*(partial, p) {
    let fetchCount = (yield this.configCollection.find({
        key: { $eq: 'activityDisplayCount' }
    }).limit(1).next()).value || 3;
    let activities = yield this.activityCollection.find().limit(fetchCount).sort({ $natural: -1 }).toArray();

    return EJSPartial.prototype._generate.call(this, partial, {
        activities,
        params: p.params
    });
});

module.exports = ActivityPartial;