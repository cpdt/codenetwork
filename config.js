const path = require('path');
const env = process.env.NODE_ENV || 'development';

module.exports = require('./' + path.join('config', env + '.json'));