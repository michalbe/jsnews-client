'use strict';

var L20n = require('l20n');
var config = require('./config');

var ctx = L20n.getContext();
ctx.linkResource('./locale/' + config.language + '/strings.lol');
ctx.requestLocales();

module.exports = ctx.getSync;
