const path = require('path');
const util = require('util');
const co = require('co');
const trea = require('trea');

const partials = require('../');

const EJSPartial = trea.EJSPartial;

function EditEventPartial(param, db) {
    EJSPartial.call(this);
    
    this.path = path.join(__dirname, 'template.ejs');
    this.partials = partials;
    this.db = db;
}
util.inherits(EditEventPartial, EJSPartial);

EditEventPartial.prototype._needsUpdate = function() {
    // no point caching for an admin page
    return false; // todo: revert to true
};

module.exports = EditEventPartial;