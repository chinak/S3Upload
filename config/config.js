var _ = require('underscore');

// Load app configuration

module.exports = _.extend(
    require(__dirname + '/../config/env/all.js'),
        require(__dirname + '/env/' + (process.env.currentEnv || require(__dirname + '/../env.js').currentEnv) + '.js') || {});