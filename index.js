var data = require('./src/data');
var renderer = require('./src/renderer');
var nav = require('./src/navigation');
var notification = require('./src/notification');
var config = require('./src/config');

var currentGroup = 0;
var currentPost = null;
var currentCache = null;
var FB = null;

var renderGroupMenu = function () {
    var groups = [];
    
    renderer.clear();
    config.groups.forEach(function(group, index) {
        groups.push({
            name: group.name,
            value: index
        });
    });
    
    nav.showGroupList(groups, function (answer) {
        currentGroup = config.groups[answer.currentGroup];
        FB.setGroup(currentGroup.id);
        renderWall();
    });
};

var renderWallMenu = function () {
    nav.showMenu(
        "Wybierz numer postu do otwarcia, 'g' by wybrać ponownie grupę lub Ctrl+C aby wyjść",
        wallActions
    );
};

var wallActions = function (answer) {
    var key = answer.menu.toLowerCase();
    if (key === 'g') {
        renderer.clear();
        renderGroupMenu();
    } 
    
    key = parseInt(key, 10);
    
    if (typeof key === 'number' && !Number.isNaN(key) && key < renderer.getNumberOfPosts()) {
        currentPost = key;
        renderer.post(key, true);
        showPostMenu();
    } else {
        renderWallMenu();  
    }
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
      renderWallMenu();
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

var renderWall = function(){
  FB.getWall(function(err, data) {
    setTimeout(renderWall, config.refreshTime);
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
    renderWallMenu();

    // check for update every config.refreshTime
  });
}

var init = function () {
    data(function (err, api) {
        FB = api;
        renderGroupMenu();
    });
};

init();