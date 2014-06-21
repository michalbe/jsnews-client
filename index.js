var FBdata = require('./src/data');
var renderer = require('./src/renderer');
var nav = require('./src/navigation');
var notification = require('./src/notification');
var config = require('./src/config');

var currentPost;
var currentCache = '';

var showOnePost = function(answer) {
  answer = parseInt(answer.menu, 10);
  if (typeof answer === 'number' && !Number.isNaN(answer) && answer < renderer.getNumberOfPosts()) {
    currentPost = answer;
    renderer.post(answer, true);
    showPostMenu();
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

var onePostAction = function(answer) {
  answer = answer.menu.toLowerCase();
  switch (answer) {
    case 'f':
      require('child_process').exec('open ' + renderer.getPostUrl(currentPost));
      renderer.post(currentPost, true);
      showPostMenu();
      break;
    case 'w':
      currentPost = null;
      renderer.all();
      showListMenu();
      break;
    default:
      renderer.post(currentPost, true);
      showPostMenu();
  }
};

var showPostMenu = function(){
  nav.showMenu(
    "Wybierz 'f' aby zobaczyć post w przeglądarce lub 'w' aby wrócić" ,
    onePostAction
  );
}

var render = function(){
  FBdata(function(err, data) {
    setTimeout(render, config.refreshTime);
    if (currentCache === '') {
      // first render, no current cache
      currentCache = JSON.stringify(data);
    } else if (currentCache !== JSON.stringify(data)) {
      // updated! notify!
      currentCache = JSON.stringify(data);
      notification();
    } else if (currentCache === JSON.stringify(data)) {
      return;
    }

    renderer.setData(data);
    renderer.all();
    showListMenu();

    // check for update every config.refreshTime
  });
}

render();
