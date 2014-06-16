var config = require('./config');
var FBdata = require('./src/data');
var notification = require('./notification');
var app = require('./controller');

var currentCache;

var setCurrentCache = function(data) {
  currentCache = JSON.stringify(data);
}

var checkUpdate = function(){
  FBdata(function(err, data) {
    var newData = JSON.stringify(data);
    if (newData !== currentCache) {
      // UPDATE!
      currentCache = newData;
      app(notification);
    } else {
      // NO UPDATE
      setTimeout(checkUpdate, config.refreshTime);
      console.log('noupdate');
    }
  });
}
