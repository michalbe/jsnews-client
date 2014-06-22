var colors = require('colors');
var config = require('./config');

var data;
var postCount = 0;

colors.setTheme(config.theme);

var setData = function(d) {
  data = d;
  postCount = d.length;
}

var clearScreen = function(){
  console.log("\u001b[2J\u001b[0;0H");
}

var numberOfPosts = function() {
  var posts = 'Ilość postów: '.main.bold + postCount.toString().second;
  console.log(posts);
}

var post = function(nr, full) {
  var likes;
  var comments;

  if (full) clearScreen();

  var currentPost = data[nr];
  console.log('-------------------------'.main);
  console.log('numer postu: '.main + nr.toString().main);
  console.log('Autor: '.main.bold, currentPost.from.name.second);

  var content = currentPost.message;
  if (!full) {
    content = content.substr(0, 150) + '...';
  }
  console.log('Treść: '.main.bold + content.second);

  likes = currentPost.likes ? currentPost.likes.data.length : 0;
  comments = currentPost.comments ? currentPost.comments.data.length : 0;
  if (!full) {
    console.log(
      'Lajki: '.main.bold +
      likes.toString().second +
      '  |  Komentarze: '.main.bold +
      comments.toString().second
    );
  } else {
    likes = likes > 0 ?
      likes.toString().second + ' [ '.main +
      currentPost.likes.data.map(
        function(l) {
          return l.name;
        }).join(', ').second +
      ' ]'.main
      : 0;

    console.log('Lajki: '.main.bold + likes);

    console.log('\nKomentarze:\n'.main.bold);
    if (comments > 0) {
      for (var i = 0; i < comments; i++) {
        comment(currentPost.comments.data[i]);
      }
    } else {
      console.log('brak...'.disable.italic);
    }
  }

}

var comment = function(com) {
  var date = new Date(com.created_time).toLocaleString().disable;
  var author = com.from.name.main;
  var msg = com.message.second;
  var likes = com.like_count.toString().second;

  console.log(date + '\n' + author);
  console.log(msg);
  console.log('Lajki: '.main + likes + '\n');
}

var all = function() {
  clearScreen();
  numberOfPosts();
  for (var i = 0, l = data.length;  i < l; i++) {
    post(i);
  }
}

module.exports = {
  setData: setData,
  all: all,
  post: post,
  clear: clearScreen,
  getNumberOfPosts: function() {
    return postCount
  },
  getPostUrl: function(nr){
    return data[nr].actions[0].link
  }
}
