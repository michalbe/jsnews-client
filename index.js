var FBdata = require('./src/data');
var renderer = require('./src/renderer');
var nav = require('./src/navigation');

var showOnePost = function(answer) {
  answer = parseInt(answer, 10);
  if (typeof answer === 'number' && !Number.isNaN(answer) && answer < renderer.getNumberOfPosts()) {
    console.log('ELO!!!');
  } else {
    renderer.all();
    showListMenu();
  }
};

var showListMenu = function() {
  nav.showMenu(
    'Wybierz numer postu do otwarcia lub Ctrl+C aby wyjść',
    showOnePost
  );
};

FBdata(function(err, data) {
  renderer.setData(data);
  renderer.all();
  showListMenu();
});
