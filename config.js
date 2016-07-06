const path = require('path');
const env = process.env.NODE_ENV || 'development';

let conf = require('./' + path.join('config', env + '.json'));
conf.env = env;
module.exports = conf;