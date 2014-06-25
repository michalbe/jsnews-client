/*global require:false, console:false, module:false, setTimeout: false, process: false*/

var data = require('./src/data');
var renderer = require('./src/renderer');
var nav = require('./src/navigation');
var notification = require('./src/notification');
var config = require('./src/config');
var fs = require('fs');

var currentGroup = -1;
var currentPost = null;
var currentCache = null;
var groupCache = [];
var groupLikeCache = [];
var groupCommentCache = [];
var postLikeCache = [];
var postCommentCache = [];
var lastCreatedPosts = [];

var FB = null;
var stopRender = false;
var follows = [];
var notifyGroups = [];

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
    currentGroup = config.groups[answer.option];
    renderWall();
  });
};

var renderWallMenu = function () {
  var options = [
    {name: 'Otwórz post', value: 'open'},
    {name: 'Zobacz listę postów obserwowanych', value: 'followlist'},
    {name: 'Wybierz ponownie grupę', value: 'groups'},
    {name: 'Zamknij  aplikacje', value: 'close'}
  ];

  nav.showGroupList("Menu", options, wallActions);
};

var wallActions = function (answer) {
  var postCount = renderer.getNumberOfPosts() - 1;
  
  answer = answer.option.toLowerCase();

  switch(answer) {
    case 'groups':
      renderer.clear();
      renderGroupMenu();
      break;
    case 'open':
      stopRender = true;
      nav.showMenu('Podaj numer postu do otwarcia (0-' + postCount +  ')', openSinglePost, function (value) {
        var number = parseInt(value, 10);
        if (typeof number === 'number' && !Number.isNaN(number) && number < renderer.getNumberOfPosts()) {
          return true;
        }

        return 'Musisz podać liczbę z przedziału od 0 do ' + postCount;
      });
      break;
    case 'followlist':
      var choices = [];

      for (var i = 0, l = follows.length; i < l; i++) {
        choices.push({
          name: follows[i].message.substr(0, 100).replace(/(?:\r\n|\r|\n)/g, ' ') + '...',
          value: i
        });
      }
      stopRender = true;
      nav.showCheckBoxes('Zaznacz posty do usunięcia z listy obserwowanych', choices, function (answer) {
        removeFollowPost(answer);
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

var removeFollowPost = function (answer) {
  var option = answer.list;
  if (option.indexOf('all') > -1) {
    follows = [];
  } else if (option.length && option.indexOf('back') === -1) {
    for (var i = option.length-1; i > -1; i--) {    
      follows.splice(parseInt(option[i], 10),1);
    }
  }

  stopRender = false;

  renderer.renderWall();
  renderWallMenu();
};

var openSinglePost = function (answer) {
  var key = answer.value;

  stopRender = false;
  currentPost = key;

  renderer.renderPost(key, true);
  renderPostMenu();
};

var renderPostMenu = function () {
  var followMsg = 'Obserwuj post';
  var followValue = 'follow';

  for (var i = 0, l = follows.length; i < l; i++) {
    if (follows[i].id === renderer.getPost(currentPost).id) {
      followMsg = 'Usuń z obserwowanych';
      followValue = 'unfollow.' + i;
    }
  }

  var options = [
    {name: 'Zobacz post w przeglądarce', value: 'browser'},
    {name: followMsg, value: followValue},
    {name: 'Wróć do listy postów', value: 'back'}
  ];

  nav.showGroupList("Menu", options, postActions);
};

var postActions = function (answer) {
  answer = answer.option.toLowerCase().split('.');

  switch(answer[0]) {
    case 'back':
      currentPost = null;
      renderer.renderWall();
      renderWallMenu();
      break;
    case 'follow':
      follows.push(renderer.getPost(currentPost));
      renderer.renderPost(currentPost, true);
      renderPostMenu();
      break;
    case 'unfollow':
      follows.splice(parseInt(answer[1], 10), 1);
      renderer.renderPost(currentPost, true);
      renderPostMenu();
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

var checkLatestPost = function (group, post) {
  if (post.created_time === post.updated_time && lastCreatedPosts[group.id] !== post.id) {
    notification(
      group.name,
      post.from.name + ' dodał(a) nowy post',
      post.message && post.message.substr(0, 50) + '...'
    );
    lastCreatedPosts[group.id] = post.id;
  }
};

var checkFollowPosts = function (post, id) {
  FB.getPost(post.id, function (err, data) {
    var followComCounts = post.comments ? post.comments.data.length : 0;
    var updatedComCounts = data.comments ? data.comments.data.length : 0;

    if (followComCounts !== updatedComCounts && updatedComCounts > 0) {
      notification(
        currentGroup.name,
        data.comments.data[updatedComCounts - 1].from.name + ' skomentował(a) obserwowany post',
        data.comments.data[updatedComCounts - 1].message.substr(0, 50) + '...'
      );
    }

    follows[id] = data;
  }); 
};

var checkLikes = function (group, data) {
  var postLikeData = {};
  data.forEach(function (post) {
    if(post.likes && post.likes.data)
    {
      postLikeData[post.id] = {
        likes: post.likes.data,
        message: post.message.length > 50 ? post.message.substr(0, 50) + '...' : post.message
      };
    }
  });

  var likeDataString = JSON.stringify(postLikeData);

  if (groupLikeCache && groupLikeCache[group.id] && groupLikeCache[group.id] === likeDataString) return;

  for (var index in postLikeData) {
    var likeData = postLikeData[index];
    if(!postLikeCache[index] || JSON.stringify(likeData) !== JSON.stringify(postLikeCache[index]))
    {
      var cacheLength = postLikeCache[index] && postLikeCache[index].likes ? postLikeCache[index].likes.length : 0;
      var countNewLikes = likeData.likes.length - cacheLength;
      var strOthers = countNewLikes > 1 ? ' i ' + (countNewLikes - 1) + ' innych' : '';
      notification(
        group.name,
        likeData.likes[0].name + strOthers + ' lubi post',
        likeData.message
      );

    }
    postLikeCache[index] = likeData;
  };
  groupLikeCache[group.id] == likeDataString;
};

var checkGroupComments = function (group, data) {
  var postCommentData = {};
  data.forEach(function (post) {
    if(post.comments && post.comments.data)
    {
      postCommentData[post.id] = {
        comments: post.comments.data,
        message: post.message.length > 50 ? post.message.substr(0, 50) + '...' : post.message
      };
    }
  });

  var commentDataString = JSON.stringify(postCommentData);

  if (groupCommentCache && groupCommentCache[group.id] && groupCommentCache[group.id] === commentDataString) return;
  logToFile('group comments change');

  for (var index in postCommentData) {
    var commentData = postCommentData[index];
    if(!postCommentCache[index] || JSON.stringify(commentData) !== JSON.stringify(postCommentCache[index]))
    {
      logToFile('post comments change');
      var cacheLength = postCommentCache[index] && postCommentCache[index].comments ? postCommentCache[index].comments.length : 0;
      var countNewComments = commentData.comments.length - cacheLength;
      var strOthers = countNewComments > 1 ? ' i ' + (countNewComments - 1) + ' innych' : '';
      var message = commentData.comments[0].message.length > 50 ? commentData.comments[0].message.substr(0, 50) + '...' : commentData.comments[0].message;
      notification(
        group.name,
        commentData.comments[0].from.name + strOthers + ' skomentował post',
        message
      );

    }
    postCommentCache[index] = commentData;
  };
  groupCommentCache[group.id] == commentDataString;

};

var checkForNotifications = function () {

  notifyGroups.forEach(function(group, index) {
    try {
      FB.getWall(group.id, function (err, data) {
        if(index === notifyGroups.length-1) {
          setTimeout(checkForNotifications, config.refreshTime);
        }

        var dataString = JSON.stringify(data);

        if (groupCache && groupCache[group.id] && groupCache[group.id] === dataString) return;

        logToFile(dataString);

        groupCache[group.id] = JSON.stringify(data);
        if(group.watchFlags & config.watchFlags.FLAG_WATCH_NEW_POSTS) {
          checkLatestPost(group, data[0]);
        }
        if(group.watchFlags & config.watchFlags.FLAG_WATCH_NEW_POST_LIKES) {
          checkLikes(group, data);
        }
        if(group.watchFlags & config.watchFlags.FLAG_WATCH_NEW_COMMENTS) {
          checkGroupComments(group, data);
        }
        for (var i = 0, l = follows.length; i < l; i++) {
          checkFollowPosts(follows[i], i);   
        }
      });
      
    }
    catch (e) {
      console.log(e);
    }
  });


};

var renderWall = function () {
  FB.getWall(currentGroup.id, function (err, data) {
    setTimeout(renderWall, config.refreshTime);

    renderer.setData(data);

    if (stopRender || currentPost) return;

    renderer.clear();
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
  if (currentGroup > -1) {
    renderWall();
  } else {
    data(function (err, api) {
      FB = api;
      renderGroupMenu();
      config.groups.forEach(function(group, index) {
        if(group.watchFlags !== undefined && group.watchFlags !== config.watchFlags.FLAG_WATCH_NONE)
        {
          notifyGroups.push(group);
        }
      });
      if(notifyGroups.length > 0)
      {
        checkForNotifications();
      }
    });
  }
};

init();

var logToFile = function(data) {
  if(typeof data !== 'string')
    data = JSON.stringify(data);
  fs.writeFile("./data.log", "\r\n\r\n" + data, {flag: 'a'}, function(err) {
    if(err) {
      console.log(err);
    }
  });
}