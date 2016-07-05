const fs = require('fs');
const ejs = require('ejs');
const co = require('co');
const debug = require('debug');

const debugCache = debug('cn:403');
const debugOk = debug('cn:200');
const debugRefresh = debug('cn:refresh');
const debugCompile = debug('cn:compile');

function NonStaticPage(path, route, partials) {
    let contents = fs.readFileSync(path, 'utf8');
    this.template = ejs.compile(contents, {
        filename: path
    });

    // find all partial references in the page
    let partialsFound = new Map();
    let partialRe = /<%-\s*partial\((?:'(.*)')|(?:"(.*)")\)\s*;?\s*%>/g;

    let singleResult;
    while ((singleResult = partialRe.exec(contents)) !== null) {
        let partialName = singleResult[1] || singleResult[2];
        partialsFound.set(partialName, partials[partialName]);
        debugCompile(partialName + ' -> /' + route);
    }

    this.partials = partialsFound;
    this.route = route;

    this.latestRenderTime = new Date();
    this.renderCache = false;
}

NonStaticPage.prototype.request = co.wrap(function *(ctx) {
    if (ctx.request.headers['if-modified-since']) {
        let modifiedTime = new Date(ctx.request.headers['if-modified-since']);
        let needSend = false;

        let latestUpdateRequired = false;
        for (let partial of this.partials) {
            let partialUpdate = partial[1].latestUpdate();
            if (latestUpdateRequired === false || partialUpdate > latestUpdateRequired) {
                latestUpdateRequired = partialUpdate;
            }
        }

        if (!latestUpdateRequired || latestUpdateRequired <= modifiedTime) {
            debugCache('/' + this.route);
            ctx.response.set('last-modified', (latestUpdateRequired || this.latestRenderTime).toUTCString());
            ctx.response.status = 304;
            ctx.body = '';
            return;
        }
    }

    // render all partials
    let partialContents = {};
    let latestUpdateRequired = false;
    let partialUpdated = false;

    for (let partial of this.partials) {
        let partialUpdate = partial[1].latestUpdate();
        if (latestUpdateRequired === false || partialUpdate > latestUpdateRequired) {
            latestUpdateRequired = partialUpdate;
        }
        let partialResult = yield partial[1].getContents();
        if (partialResult[1]) partialUpdated = true;
        partialContents[partial[0]] = partialResult[0];
    }

    if (partialUpdated) this.latestRenderTime = latestUpdateRequired;
    if (!this.renderCache || partialUpdated) {
        debugRefresh('/' + this.route);
        this.renderCache = this.template({
            partial: name => partialContents[name]
        });
    }

    ctx.response.set('last-modified', this.latestRenderTime.toUTCString());
    ctx.body = this.renderCache;
    debugOk('/' + this.route);
});

module.exports = NonStaticPage;