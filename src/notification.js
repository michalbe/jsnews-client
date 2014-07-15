'use strict';

var Notification = require('node-notifier');

var notifier = new Notification();

module.exports = function(title, subtitle, message) {
  notifier.notify({
    title: title,
    subtitle: subtitle,
    message: message
  });
};
