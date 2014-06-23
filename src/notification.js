/*global require:false, console:false, module:false*/

var Notification = require('node-notifier');
var config = require('./config');

var notifier = new Notification();

module.exports = function(title, subtitle, message) {
  notifier.notify({
    title: title,
    subtitle: subtitle,
    message: message
  });
};
