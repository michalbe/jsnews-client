'use strict';

var data = require('./src/data');
var renderer = require('./src/renderer');
var nav = require('./src/navigation');
var notification = require('./src/notification');
var config = require('./src/config');
var flags = require('./src/watchflags');
var _ = require('./src/localization');

var currentGroup = -1;
var currentPost = null;
var groupCache = [];
var groupLikeCache = [];
var groupCommentCache = [];
var postLikeCache = [];
var postCommentCache = [];
var postCommentLikeCache = [];
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
      renderer.clear();
      renderGroupMenu();
      break;
    case 'open':
      stopRender = true;
      nav.showMenu(
        _('postNumber') + postCount +  ')',
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

          return _('numerLimit ') + postCount;
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
  var followMsg = _('followPost');
  var followValue = 'follow';

  for (var i = 0, l = follows.length; i < l; i++) {
    if (follows[i].id === renderer.getPost(currentPost).id) {
      followMsg = _('unfollowPost');
      followValue = 'unfollow.' + i;
    }
  }

  var options = [
    {name: _('openPost'), value: 'browser'},
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
      post.from.name + _(' addedPost'),
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
        data.comments.data[updatedComCounts - 1].from.name +
          _(' commentedFollowedPost'),
        data.comments.data[updatedComCounts - 1].message.substr(0, 50) + '...'
      );
    }

    follows[id] = data;
  });
};

var checkLikes = function (group, data) {
  var postLikeData = {};
  data.forEach(function (post) {
    if(post.likes && post.likes.data) {
      postLikeData[post.id] = {
        likes: post.likes.data,
        message: post.message.length > 50 ?
          post.message.substr(0, 50) + '...' :
          post.message
      };
    }
  });

  var likeDataString = JSON.stringify(postLikeData);

  if (
    groupLikeCache &&
    groupLikeCache[group.id] &&
    groupLikeCache[group.id] === likeDataString
  ) {
    return;
  }

  for (var index in postLikeData) {
    var likeData = postLikeData[index];
    if(
      !postLikeCache[index] ||
      JSON.stringify(likeData) !== JSON.stringify(postLikeCache[index])
    ) {
      var cacheLength = postLikeCache[index] && postLikeCache[index].likes ?
                        postLikeCache[index].likes.length : 0;
      var countNewLikes = likeData.likes.length - cacheLength;
      var strOthers = countNewLikes > 1 ?
                      ' i ' + (countNewLikes - 1) + ' ' + _('others') :
                      '';
      notification(
        group.name,
        likeData.likes[0].name + strOthers + _(' likePost'),
        likeData.message
      );

    }
    postLikeCache[index] = likeData;
  }
  groupLikeCache[group.id] = likeDataString;
};

var checkGroupCommentsAndLikes = function (group, data) {
  var postCommentData = {},
    commentsLikeData = {};
  data.forEach(function (post) {
    if(post.comments && post.comments.data) {
      postCommentData[post.id] = {
        comments: post.comments.data,
        message: post.message.length > 50 ?
                 post.message.substr(0, 50) + '...' :
                 post.message
      };
      if(group.watchFlags & flags.FLAG_WATCH_NEW_COMMENT_LIKES) {
        post.comments.data.forEach(function (comment) {
          commentsLikeData[comment.id] = {
            likes: comment.like_count,
            message: comment.message.length > 50 ?
                    comment.message.substr(0, 50) + '...' :
                    comment.message
          };
        });
      }
    }
  });

  var commentDataString = JSON.stringify(postCommentData);
  var commentLikeDataString = JSON.stringify(commentsLikeData);

  if (
    groupCommentCache &&
    groupCommentCache[group.id] &&
    groupCommentCache[group.id] === commentDataString
  ) {
    return;
  }

  for (var index in postCommentData) {
    var commentData = postCommentData[index];
    if(
      !postCommentCache[index] ||
      JSON.stringify(commentData) !== JSON.stringify(postCommentCache[index])
    ) {
      var cacheLength = postCommentCache[index] &&
                        postCommentCache[index].comments ?
                          postCommentCache[index].comments.length :
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
        var message =
          commentData.comments[lastCommentIndex].message.length > 50 ?
          commentData.comments[lastCommentIndex].message.substr(0, 50) + '...' :
          commentData.comments[lastCommentIndex].message;
        var title = commentData.comments[lastCommentIndex].from.name +
                    strOthers + _(' commentedPost ') + commentData.message;
        notification(
          group.name,
          title,
          message
        );
      } else if (
        countNewComments <= 0 &&
        group.watchFlags & flags.FLAG_WATCH_NEW_COMMENT_LIKES &&
        postCommentLikeCache &&
        postCommentLikeCache[group.id] &&
        JSON.stringify(postCommentLikeCache[group.id]) !== commentLikeDataString
      ) {
        for (var commentId in commentsLikeData) {
          var commentLikeData = commentsLikeData[commentId];
          if(
            commentLikeData.likes >
            postCommentLikeCache[group.id][commentId].likes
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
    postCommentCache[index] = commentData;
  }
  groupCommentCache[group.id] = commentDataString;
  postCommentLikeCache[group.id] = commentsLikeData;

};

var checkForNotifications = function () {

  notifyGroups.forEach(function(group, index) {
    try {
      FB.getWall(group.id, function (err, data) {
        if(index === notifyGroups.length-1) {
          setTimeout(checkForNotifications, config.refreshTime);
        }

        var dataString = JSON.stringify(data);

        if (
          groupCache &&
          groupCache[group.id] &&
          groupCache[group.id] === dataString
        ) {
          return;
        }

        groupCache[group.id] = JSON.stringify(data);
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

var init = function () {
  if (currentGroup > -1) {
    renderWall();
  } else {
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

init();
