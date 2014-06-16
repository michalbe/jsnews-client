var FBdata = require('./src/data');
var renderer = require('./src/renderer');

FBdata(function(err, data){
  renderer.setData(data);
  renderer.all();
});
