/*global require:false, console:false, module:false, setTimeout: false*/

var data = require('./src/data');
var renderer = require('./src/renderer');
var nav = require('./src/navigation');
var notification = require('./src/notification');
var config = require('./src/config');

var currentGroup = 0;
var currentPost = null;
var currentCache = null;
var lastCreatedPost = null;
var FB = null;
var openingPost = false;

var renderGroupMenu = function () {
    var groups = [];
    
    config.groups.forEach(function(group, index) {
        groups.push({
            name: group.name,
            value: index
        });
    });
    
    renderer.clear();
    nav.showGroupList('Wybierz grupę', groups, function (answer) {
        currentCache = null;
        currentGroup = config.groups[answer.option];
        FB.setGroup(currentGroup.id);
        renderWall();
    });
};

var renderWallMenu = function () {
    var options = [
        {name: 'Otwórz post', value: 'open'},
        {name: 'Wybierz ponownie grupę', value: 'groups'},
        {name: 'Zamknij  aplikacje', value: 'close'}
    ];
    
    nav.showGroupList("Menu", options, wallActions);
};

var wallActions = function (answer) {
    answer = answer.option.toLowerCase();
    
    switch(answer) {
        case 'groups':
            renderer.clear();
            renderGroupMenu();
            break;
        case 'open':
            openingPost = true;
            nav.showMenu("Podaj numer postu do otwarcia (0-7)", openSinglePost, function (value) {
                var number = parseInt(value, 10);
                if (typeof number === 'number' && !Number.isNaN(number) && number < renderer.getNumberOfPosts()) {
                    return true;
                }

                return "Musisz podać liczbę z przedziału od 0 do 7";
            });
            break;
        case 'close':
            process.exit();
            break;
        default:
            renderWallMenu();
            break;
    }
};

var openSinglePost = function (answer) {
    var key = answer.value;
    
    openingPost = false;
    currentPost = key;
    
    console.log(key);
    
    renderer.renderPost(key, true);
    renderPostMenu();
};

var renderPostMenu = function () {
    var options = [
        {name: 'Zobacz post w przeglądarce', value: 'browser'},
        {name: 'Wróć do listy postów', value: 'back'}
    ];
    
    nav.showGroupList("Menu", options, postActions);
};

var postActions = function (answer) {
    answer = answer.option.toLowerCase();
    
    switch(answer) {
        case 'back':
            currentPost = null;
            renderer.renderWall();
            renderWallMenu();
            break;

        case 'browser':
            require('child_process').exec('open ' + renderer.getPostUrl(currentPost));
            renderer.renderPost(currentPost, true);
            renderPostMenu();
            break;
        default:
            renderPostMenu();
            break;
    }
};

var checkLatestPost = function (post) {
    if (post.created_time === post.updated_time && lastCreatedPost !== post.id) {
        notification(
            currentGroup.name
            , post.from.name + ' dodał(a) nowy post'
            , post.message && post.message.substr(0, 50) + '...'
        );
        lastCreatedPost = post.id;
    }
};

var renderWall = function () {
    FB.getWall(function (err, data) {
        setTimeout(renderWall, config.refreshTime);
        
        var dataString = JSON.stringify(data);
        
        if (currentCache && currentCache === dataString) return;
        
        currentCache = JSON.stringify(data);
        checkLatestPost(data[0]);
        
        if (openingPost || currentPost) return;
        
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