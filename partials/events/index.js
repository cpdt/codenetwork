const fs = require('fs');
const path = require('path');
const co = require('co');
const ejs = require('ejs');
const Promise = require('bluebird');

module.exports = co.wrap(function *(db) {
    // during init stage, fs sync is fine
    let templateFile = path.join(__dirname, 'template.ejs');
    let templateContent = fs.readFileSync(templateFile, 'utf8');
    let template = ejs.compile(templateContent, {
        filename: templateFile
    });

    let eventsCollection = db.collection('events');
    let configCollection = db.collection('config');

    // find the most recent event
    let latestRecord = yield eventsCollection.find().limit(1).sort({ $natural: -1 }).next();
    let latestUpdate = latestRecord._id.getTimestamp();
    let contentCache = false;

    const regenContent = co.wrap(function *() {
        // find how many events to fetch
        let fetchCount = (yield configCollection.find({ key: { $eq: 'eventDisplayCount' } }).limit(1).next()).value || 3;
        let events = yield eventsCollection.find().limit(fetchCount).sort({ $natural: -1 }).toArray();

        // render the template w/ fetched events
        contentCache = template({ events });
        return contentCache;
    });

    return {
        latestUpdate: () => latestUpdate,
        getContents: co.wrap(function *() {
            if (contentCache === false) return [yield regenContent(), true];

            // find if a new event has been published
            let newLatestRecord = yield eventsCollection.find().limit(1).sort({ $natural: -1 }).next();
            if (newLatestRecord._id !== latestRecord._id) {
                latestRecord = newLatestRecord;
                latestUpdate = latestRecord._id.getTimestamp();
                return [yield regenContent(), true];
            }

            return [contentCache, false];
        })
    };
});
