var FBdata = require('./src/data');
var renderer = require('./src/renderer');
var nav = require('./src/navigation');

FBdata(function(err, data) {
  renderer.setData(data);
  renderer.all();
  nav.showMenu(
    'Wybierz numer postu do otwarcia lub Ctrl+c aby wyjść',
    function(answer){
      console.log(answer);
    }
  );
});
