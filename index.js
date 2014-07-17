'use strict';

var data = require('./src/data');
var renderer = require('./src/renderer');
var nav = require('./src/navigation');
var notification = require('./src/notification');
var config = require('./src/config');
var flags = require('./src/watchflags');
var _ = require('./src/localization');
var level = require('level');
var utils = require('utils');

var db = level('./jsnews-cache');
var currentGroup = -1;
var currentPost = null;
var STATE_LOADING = -1;
var caches = {
  group: STATE_LOADING,
  groupLike: STATE_LOADING,
  groupComment: STATE_LOADING,
  postLike: STATE_LOADING,
  postComment: STATE_LOADING,
  postCommentLike: STATE_LOADING
};
var cacheKeys = Object.keys(caches);
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
  nav.showGroupList(_('chooseGroup'), groups, function (answer) {
    stopRender = false;
    currentGroup = config.groups[answer.option];
    renderWall();
  });
};

var renderWallMenu = function () {
  var options = [
    {name: _('openPost'), value: 'open'},
    {name: _('showFavorites'), value: 'followlist'},
    {name: _('chooseGroup'), value: 'groups'},
    {name: _('closeApp'), value: 'close'}
  ];

  nav.showGroupList('Menu', options, wallActions);
};

var wallActions = function (answer) {
  var postCount = renderer.getNumberOfPosts() - 1;

  answer = answer.option.toLowerCase();

  switch(answer) {
    case 'groups':
      stopRender = true;
      renderer.clear();
      renderGroupMenu();
      break;
    case 'open':
      stopRender = true;
      nav.showMenu(
        _('postNumber') + '( 0 - ' + postCount +  ' )',
        openSinglePost,
        function (value) {
          var number = parseInt(value, 10);
          if (
            typeof number === 'number' &&
            !Number.isNaN(number) &&
            number < renderer.getNumberOfPosts()
          ) {
            return true;
          }

          return _('numerLimit') + ' ' + postCount;
        }
      );
      break;
    case 'followlist':
      var choices = [];

      for (var i = 0, l = follows.length; i < l; i++) {
        choices.push({
          name: follows[i].message.substr(0, 100)
                .replace(/(?:\r\n|\r|\n)/g, ' ') + '...',
          value: i
        });
      }
      stopRender = true;
      nav.showCheckBoxes(
        _('selectPostToDelete'),
        choices,
        function (answer) {
          removeFollowPost(answer);
        }
      );
      break;
    case 'close':
      cleanOnExit();
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
  var followMsg = _('followPost');
  var followValue = 'follow';

  for (var i = 0, l = follows.length; i < l; i++) {
    if (follows[i].id === renderer.getPost(currentPost).id) {
      followMsg = _('unfollowPost');
      followValue = 'unfollow.' + i;
    }
  }

  var options = [
    {name: _('openPostInBrowser'), value: 'browser'},
    {name: followMsg, value: followValue},
    {name: _('backList'), value: 'back'}
  ];

  nav.showGroupList( _('menu'), options, postActions);
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
  if (
    post.created_time === post.updated_time &&
    lastCreatedPosts[group.id] !== post.id
  ) {
    notification(
      group.name,
      post.from.name + _('addedPost'),
      post.message && utils.trim(post.message, 50)
    );
    lastCreatedPosts[group.id] = post.id;
  }
};

var checkFollowPosts = function (post, id) {
  FB.getPost(post.id, function (err, data) {
    var followComCounts = post.comments ? post.comments.data.length : 0;
    var updatedComCounts = data.comments ? data.comments.data.length : 0;

    if (followComCounts !== updatedComCounts && updatedComCounts > 0) {
      var commentData = data.comments.data[updatedComCounts - 1];
      notification(
        currentGroup.name,
        commentData.from.name + _('commentedFollowedPost'),
        utils.trim(commentData.message, 50)
      );
    }

    follows[id] = data;
  });
};

var checkLikes = function (group, data) {
  var postLikeData = {};

  if (caches.groupLike == STATE_LOADING || caches.postLike == STATE_LOADING) {
    return;
  }
  data.forEach(function (post) {
    if(post.likes && post.likes.data) {
      postLikeData[post.id] = {
        likes: post.likes.data,
        message: utils.trim(post.message, 50)
      };
    }
  });

  var likeString = JSON.stringify(postLikeData);

  if (
    caches.groupLike &&
    caches.groupLike[group.id] &&
    caches.groupLike[group.id] === likeString
  ) {
    return;
  }

  for (var index in postLikeData) {
    var likeData = postLikeData[index];
    if(
      !caches.postLike[index] ||
      JSON.stringify(likeData) !== JSON.stringify(caches.postLike[index])
    ) {
      var cacheLength = caches.postLike[index] && caches.postLike[index].likes ?
                        caches.postLike[index].likes.length : 0;
      var countNewLikes = likeData.likes.length - cacheLength;
      var strOthers = countNewLikes > 1 ?
                      ' i ' + (countNewLikes - 1) + ' ' + _('others') :
                      '';
      notification(
        group.name,
        likeData.likes[0].name + strOthers + _('likePost'),
        likeData.message
      );

    }
    caches.postLike[index] = likeData;
  }
  caches.groupLike[group.id] = likeString;
  saveCache('groupLike');
  saveCache('postLike');
};

var checkGroupCommentsAndLikes = function (group, data) {
  var postCommentData = {},
    commentsLikeData = {};

  if (caches.groupComment == STATE_LOADING ||
    caches.postComment == STATE_LOADING ||
    caches.postCommentLike == STATE_LOADING)
  {
    return;
  }

  data.forEach(function (post) {
    if(post.comments && post.comments.data) {
      postCommentData[post.id] = {
        comments: post.comments.data,
        message: utils.trim(post.message, 50)
      };
      if(group.watchFlags & flags.FLAG_WATCH_NEW_COMMENT_LIKES) {
        post.comments.data.forEach(function (comment) {
          commentsLikeData[comment.id] = {
            likes: comment.like_count,
            message: utils.trim(comment.message, 50)
          };
        });
      }
    }
  });

  var commentString = JSON.stringify(postCommentData);
  var commentLikeString = JSON.stringify(commentsLikeData);

  if (
    caches.groupComment &&
    caches.groupComment[group.id] &&
    caches.groupComment[group.id] === commentString
  ) {
    return;
  }

  for (var index in postCommentData) {
    var commentData = postCommentData[index];
    if(
      !caches.postComment[index] ||
      JSON.stringify(commentData) !== JSON.stringify(caches.postComment[index])
    ) {
      var cacheLength = caches.postComment[index] &&
                        caches.postComment[index].comments ?
                          caches.postComment[index].comments.length :
                          0;

      var countNewComments = commentData.comments.length - cacheLength;
      if (
        countNewComments > 0 &&
        group.watchFlags & flags.FLAG_WATCH_NEW_COMMENTS
      ) {
        var strOthers = countNewComments > 1 ?
                        ' i ' + (countNewComments - 1) + ' ' + _('others') :
                        '';
        var lastCommentIndex = commentData.comments.length - 1;
        var lastComment = commentData.comments[lastCommentIndex];
        var message = utils.trim(lastComment.message, 50);
        var title = lastComment.from.name +
                    strOthers + _('commentedPost') + ' ' + commentData.message;
        notification(
          group.name,
          title,
          message
        );
      } else if (
        countNewComments <= 0 &&
        group.watchFlags & flags.FLAG_WATCH_NEW_COMMENT_LIKES &&
        caches.postCommentLike &&
        caches.postCommentLike[group.id] &&
        JSON.stringify(caches.postCommentLike[group.id]) !== commentLikeString
      ) {
        for (var commentId in commentsLikeData) {
          var commentLikeData = commentsLikeData[commentId];
          if(
            commentLikeData.likes >
            caches.postCommentLike[group.id][commentId].likes
          ) {
            notification(
              group.name,
              _('newLikedComment'),
              commentLikeData.message
            );
          }
        }
      }
    }
    caches.postComment[index] = commentData;
  }
  saveCache('postComment');
  caches.groupComment[group.id] = commentString;
  saveCache('groupComment');
  caches.postCommentLike[group.id] = commentsLikeData;
  saveCache('postCommentLike');

};

var checkForNotifications = function () {

  notifyGroups.forEach(function(group, index) {
    try {
      FB.getWall(group.id, function (err, data) {
        if(index === notifyGroups.length-1) {
          setTimeout(checkForNotifications, config.refreshTime);
        }

        if (caches.group == STATE_LOADING || !data[0]) {
          return;
        }

        var dataString = JSON.stringify(data);

        if (
          caches.group &&
          caches.group[group.id] &&
          caches.group[group.id] === dataString
        ) {
          return;
        }

        caches.group[group.id] = dataString;
        saveCache('group');
        if(group.watchFlags & flags.FLAG_WATCH_NEW_POSTS) {
          checkLatestPost(group, data[0]);
        }
        if(group.watchFlags & flags.FLAG_WATCH_NEW_POST_LIKES) {
          checkLikes(group, data);
        }
        if(
          group.watchFlags & flags.FLAG_WATCH_NEW_COMMENTS ||
          group.watchFlags & flags.FLAG_WATCH_NEW_COMMENT_LIKES
        ) {
          checkGroupCommentsAndLikes(group, data);
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

    if (stopRender || currentPost) {
      return;
    }

    renderer.clear();
    renderer.renderWall();
    renderWallMenu();
  });
};

var cleanOnExit = function() {
  process.exit();
};

var saveCache = function(key) {
  var data = JSON.stringify(caches[key]);
  db.put(key, data);
};

var readCache = function(key) {
  db.get(key, function(err, value) {
    if (err) {
      caches[key] = {};
      return;
    }
    try {
      caches[key] = JSON.parse(value);
    } catch (parseErr) {
      caches[key] = {};
    }
  });
};

var init = function () {
  if (currentGroup > -1) {
    renderWall();
  } else {
    cacheKeys.forEach(readCache);
    data(function (err, api) {
      FB = api;
      renderGroupMenu();
      config.groups.forEach(function(group, index) {
        if(
          group.watchFlags !== undefined &&
          group.watchFlags !== flags.FLAG_WATCH_NONE
        ) {
          notifyGroups.push(group);
        }
      });
      if(notifyGroups.length > 0) {
        checkForNotifications();
      }
    });
  }
};

process.on('SIGINT', function() {
    cleanOnExit();
});

init();
