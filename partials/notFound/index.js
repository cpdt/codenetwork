const path = require('path');
const util = require('util');
const co = require('co');
const trea = require('trea');

const partials = require('../');

const EJSPartial = trea.EJSPartial;

function NotFoundPartial(param, db) {
    EJSPartial.call(this);
    
    this.path = path.join(__dirname, 'template.ejs');
    this.partials = partials;
    this.db = db;
    
    this.errorMessagesCollection = db.collection('error_messages');
}
util.inherits(NotFoundPartial, EJSPartial);

NotFoundPartial.prototype._needsUpdate = function() {
    // we display random messages, so always update
    return true;
};

NotFoundPartial.prototype._generate = co.wrap(function*(partial, p) {
    let result = yield this.errorMessagesCollection.aggregate([{ $sample: { size: 1 } }]).next();
    return EJSPartial.prototype._generate.call(this, partial, {
        message: result.text,
        params: p.params
    });
});

module.exports = NotFoundPartial;