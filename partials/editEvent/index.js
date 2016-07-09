const fs = require('mz/fs');
const path = require('path');
const util = require('util');
const co = require('co');
const trea = require('trea');
const slug = require('slug');
const marked = require('marked');
const hljs = require('highlight.js');
const trunc = require('trunc-html');
const sanitizeHtml = require('sanitize-html');

const partials = require('../');

const EJSPartial = trea.EJSPartial;

const publicRoot = path.join(__dirname, '../../public');

marked.setOptions({
    highlight: function(code, lang) {
        if (lang) return hljs.highlight(lang, code, true).value;
        return hljs.highlightAuto(code).value;
    },
    breaks: true
});

function EditEventPartial(param, db) {
    EJSPartial.call(this);
    
    this.path = path.join(__dirname, 'template.ejs');
    this.partials = partials;
    this.db = db;

    this.cacheCollection = db.collection('cache');
    this.eventsCollection = db.collection('events');
}
util.inherits(EditEventPartial, EJSPartial);

EditEventPartial.prototype._needsUpdate = function() {
    // no point caching for an admin page
    return true; // todo: revert to true
};

EditEventPartial.prototype._act = co.wrap(function*(ctx, p) {
    if (ctx.request.method === 'POST') {
        let isNew = p.params.id === 'new';
        let errors = [];
        let received = ctx.request.body.fields;
        let files = ctx.request.body.files;

        let receivedName = received.name.trim();
        let receivedPriority = parseInt(received.priority.trim(), 10);
        let receivedWhen = received.when.trim();
        let receivedDescription = received.description.trim();
        let receivedActions = received.actions.trim();

        if (!receivedName) errors.push('Please provide an event name');
        if (isNaN(receivedPriority)) errors.push('Please provide a valid priority');
        if (!receivedWhen) errors.push('Please provide a when/where value');
        if (!receivedDescription) errors.push('Please provide a description');

        let hasSmall = files['small-img'].size;
        let hasLarge = files['large-img'].size;
        let smallImage = files['small-img'];
        let largeImage = files['large-img'];

        if (isNew) {
            if (!hasSmall) errors.push('Please provide a small image');
            if (!hasLarge) errors.push('Please provide a large image');
        }

        if (hasSmall && !/^image\/\w+/gi.test(smallImage.type)) errors.push('Please upload a valid small image');
        if (hasLarge && !/^image\/\w+/gi.test(largeImage.type)) errors.push('Please upload a valid large image');

        if (!hasSmall) yield fs.unlink(smallImage.path);
        if (!hasLarge) yield fs.unlink(largeImage.path);

        if (errors.length) {
            if (errors.length === 1) p.error = errors[0];
            else p.error = 'Please fix the following issues: <ul><li>' + errors.join('</li><li>') + '</li></ul>';

            // delete the images if required
            if (hasSmall) yield fs.unlink(smallImage.path);
            if (hasLarge) yield fs.unlink(largeImage.path);

            return;
        }

        let isBig = received.big === 'on';
        let wordCount = isBig ? 730 : 330;
        let renderedContent = sanitizeHtml(marked(receivedDescription), {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'img', 'span']),
            allowedAttributes: {
                a: [ 'href', 'name', 'target' ],
                img: [ 'src' ],
                span: [ 'class' ]
            }
        });

        // for the preview, change H tags to bolded paragraphs
        let previewContent = renderedContent.replace(/<h[0-6]>/ig, "<p><strong>")
                                            .replace(/<\/h[0-6]>/ig, "</strong></p>");

        // make sure the slug is unique by potentially adding a number to the end
        let realSlug = p.params.id;
        if (isNew) {
            let currentSlug = slug(receivedName).toLowerCase();
            let slugNumber = 1;

            function generateSlug() {
                return (currentSlug + (slugNumber === 1 ? '' : ('-' + slugNumber))).toLowerCase();
            }

            while (yield this.eventsCollection.find({slug: {$eq: generateSlug()}}).hasNext()) {
                slugNumber++;
            }
            realSlug = generateSlug();
        }

        let newEvent = {
            priority: receivedPriority,
            isBig,
            name: receivedName,
            slug: realSlug,
            whenWhere: receivedWhen,
            rawDescription: receivedDescription,
            actions: receivedActions,
            renderedShortDescription: trunc(previewContent, wordCount).html,
            renderedDescription: renderedContent,
            updateTime: new Date()
        };
        if (hasSmall) newEvent.smallImagePath = path.parse(smallImage.path).base;
        if (hasLarge) newEvent.bigImagePath = path.parse(largeImage.path).base;

        yield this.cacheCollection.updateOne({ key: 'events' }, {
            $set: { value: newEvent.updateTime }
        });

        if (isNew) {
            yield this.eventsCollection.insertOne(newEvent);
            p.message = '<strong>Success.</strong> The event has been created. <a href="/event/' + realSlug + '">View event</a>';
        } else {
            yield this.eventsCollection.updateOne({ slug: p.params.id }, { $set: newEvent });
            p.message = '<strong>Success.</strong> The event has been updated. <a href="/event/' + realSlug + '">View event</a>';
        }
    }
});

EditEventPartial.prototype._generate = co.wrap(function*(partial, p) {
    let event = {
        priority: 1,
        isBig: false,
        smallImagePath: '',
        bigImagePath: '',
        name: "",
        slug: "",
        whenWhere: "",
        rawDescription: "",
        actions: ""
    };
    let newEvent = p.params.id === 'new';
    if (!newEvent) {
        let fetchedEvent = yield this.eventsCollection.find({ slug: { $eq: p.params.id } }).limit(1).next();
        if (fetchedEvent) event = fetchedEvent;
        else newEvent = true;
    }

    return EJSPartial.prototype._generate.call(this, partial, {
        newEvent,
        event,
        params: p.params,
        message: p.message || '',
        error: p.error || ''
    });
});

module.exports = EditEventPartial;