var colors = require('colors');
var data;
var postCount = 0;

var setData = function(d) {
  data = d;
  postCount = d.length;
}

var clearScreen = function(){
  console.log("\u001b[2J\u001b[0;0H");
}

var numberOfPosts = function() {
  var posts = 'Ilość postów: '.magenta.bold + postCount.toString().yellow;
  console.log(posts);
}

var post = function(nr, full) {
  var likes;
  var comments;

  if (full) clearScreen();

  var currentPost = data[nr];
  console.log('-------------------------'.magenta);
  console.log('numer postu: '.magenta + nr.toString().magenta);
  console.log('Autor: '.magenta.bold, currentPost.from.name.yellow);

  var content = currentPost.message;
  if (!full) {
    content = content.substr(0, 150) + '...';
  }
  console.log('Treść: '.bold.magenta + content.yellow);

  likes = currentPost.likes ? currentPost.likes.data.length : 0;
  comments = currentPost.comments ? currentPost.comments.data.length : 0;
  if (!full) {
    console.log(
      'Lajki: '.bold.magenta +
      likes.toString().yellow +
      '  |  Komentarze: '.bold.magenta +
      comments.toString().yellow
    );
  } else {
    likes = likes > 0 ?
      likes.toString().yellow + ' [ '.magenta +
      currentPost.likes.data.map(
        function(l) {
          return l.name;
        }).join(', ').yellow +
      ' ]'.magenta
      : 0;

    console.log('Lajki: '.bold.magenta + likes);

  }

  if (full) {
    console.log(currentPost);
    console.log(currentPost.comments.data[1]);
  }

}

var comment = function(com) {
  var date = new Date(com.created_time).toLocaleString().grey;
  var author = com.from.name.magenta.bold;
  var msg = com.message.yellow;
  var likes = com.like_count.yellow;

  console.log(date + ' | ' + author);
  console.log(msg);
  console.log('Lajki: '.magenta.bold + likes);
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
  }
}
