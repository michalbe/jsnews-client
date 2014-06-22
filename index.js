/*global require:false, console:false, module:false, setTimeout: false*/

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
        renderer.renderPost(key, true);
        renderPostMenu();
    } else {
        renderWallMenu();  
    }
};

var renderPostMenu = function () {
    nav.showMenu(
        "Wybierz 'f' aby zobaczyć post w przeglądarce lub 'w' aby wrócić",
        postActions
    );
};

var postActions = function (answer) {
    answer = answer.menu.toLowerCase();
    
    switch(answer) {
        case 'w':
            currentPost = null;
            renderer.renderWall();
            renderWallMenu();
            break;
        case 'f':
            require('child_process').exec('open ' + renderer.getPostUrl(currentPost));
            renderer.renderPost(currentPost, true);
            renderPostMenu();
            break;
        default:
            renderPostMenu();
            break;
    }
};

var renderWall = function () {
    FB.getWall(function (err, data) {
        setTimeout(renderWall, config.refreshTime);
        
        var dataString = JSON.stringify(data);
        
        if (currentCache && currentCache === dataString) return;
        
        currentCache = JSON.stringify(data);
        
        if (currentPost) return;
        
        renderer.clear();
        renderer.setData(data);
        renderer.renderWall();
        renderWallMenu();
    });
};

var renderSinglePost = function (id) {
    currentPost = id;
    renderer.renderPost(id, true);
    renderPostMenu();
};

var init = function () {
    data(function (err, api) {
        FB = api;
        renderGroupMenu();
    });
};

init();