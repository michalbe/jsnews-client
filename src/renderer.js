'use strict';

var colors = require('colors');
var config = require('./config');
var _ = require('./localization');

var data;
var postsCount = 0;

colors.setTheme(config.theme);

var setData = function(d) {
  data = d;
  postsCount = d.length;
};

var clearScreen = function(){
  console.log('\u001b[2J\u001b[0;0H');
};

var renderNumberOfPosts = function() {
  var posts = _('quantityPosts').main.bold + postsCount.toString().second;
  console.log(posts);
};

var renderWall = function () {
  clearScreen();
  renderNumberOfPosts();

  for (var i = 0; i < postsCount; i++) {
    renderPost(i);
  }

  console.log('\n-------------------------\n'.main);
};

var renderPost = function (index, full) {
  var currentPost = data[index];
  var content = currentPost.message || '';
  var likesCount = currentPost.likes ? currentPost.likes.data.length : 0;
  var commentsCount =
    currentPost.comments ?
    currentPost.comments.data.length :
    0;

  content = full ? content : content.substr(0, 150) + '...';

  if (full) {
    clearScreen();
  }

  console.log('\n');
  console.log('-------------------------'.main);
  console.log( _('postNumber').main + index.toString().main);
  console.log( _('author ').main.bold, currentPost.from.name.second);
  console.log( _('contents ').main.bold + content.second);

  if (!full) {
    console.log(
      _('likes').main.bold + likesCount.toString().second + '| ' +
      _('comments ').main.bold + commentsCount.toString().second
    );
  } else {
    renderLikes(currentPost.likes);
    renderComments(commentsCount, currentPost.comments);
    console.log('-------------------------\n'.main);
  }
};

var renderLikes = function (likes) {
  var like = likes ?
      likes.data.length.toString().second + ' [ '.main +
      likes.data.map(function(l) {
        return l.name;
      }).join(', ').second + ' ]'.main : 0;

  console.log( _('likes').main.bold + like);
};

var renderComments = function(count, comments) {

  console.log( _('\n' + 'comments' + '\n').main.bold);
  if (count > 0) {
    for (var i = 0; i < count; i++) {
      renderComment(comments.data[i]);
    }
  } else {
    console.log( _('lack').disable.italic);
  }
};

var renderComment = function (comment) {
  var date = new Date(comment.created_time).toLocaleString().disable;
  var author = comment.from.name.main;
  var msg = comment.message.second;
  var likes = comment.like_count.toString().second;

  console.log(date + '\n' + author);
  console.log(msg);
  console.log( _('likes ').magenta + likes + '\n');
};

module.exports = {
  setData: setData,
  renderWall: renderWall,
  renderPost: renderPost,
  clear: clearScreen,
  getNumberOfPosts: function() {
    return postsCount;
  },
  getPostUrl: function(index){
    return data[index].actions[0].link;
  },
  getPost: function (index) {
    return data[index];
  }
};
