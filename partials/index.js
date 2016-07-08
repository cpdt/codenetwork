module.exports = function(name, ...params) {
    let colonIndex = name.indexOf(':');
    let partialName = name, param = 'default';
    if (colonIndex !== -1) {
        partialName = name.substring(0, colonIndex);
        param = name.substring(colonIndex + 1);
    }

    if (!partialCache.has(partialName)) partialCache.set(partialName, new Map());
    let subPartials = partialCache.get(partialName);

    if (!subPartials.has(param)) {
        let constructor = partials[partialName];
        subPartials.set(param, new constructor(param, ...params));
    }

    return subPartials.get(param);
};

let partials = {
    events: require('./events'),
    activity: require('./activity'),
    notFound: require('./notFound'),
    editEvent: require('./editEvent')
};

let partialCache = new Map();