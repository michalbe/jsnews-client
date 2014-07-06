'use strict';

var defineWatchFlag = function (name, value) {
  Object.defineProperty(module.exports, name, {
    value:      value,
    enumerable: true
  });
};

var FLAG_WATCH_NONE = 0;
var FLAG_WATCH_NEW_POSTS = 1;
var FLAG_WATCH_NEW_POST_LIKES = 2;
var FLAG_WATCH_NEW_COMMENTS = 4;
var FLAG_WATCH_NEW_COMMENT_LIKES = 8;

defineWatchFlag('FLAG_WATCH_NONE', FLAG_WATCH_NONE);
defineWatchFlag('FLAG_WATCH_NEW_POSTS', FLAG_WATCH_NEW_POSTS);
defineWatchFlag('FLAG_WATCH_NEW_POST_LIKES', FLAG_WATCH_NEW_POST_LIKES);
defineWatchFlag('FLAG_WATCH_NEW_COMMENTS', FLAG_WATCH_NEW_COMMENTS);
defineWatchFlag('FLAG_WATCH_NEW_COMMENT_LIKES', FLAG_WATCH_NEW_COMMENT_LIKES);
