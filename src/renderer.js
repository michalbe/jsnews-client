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
  var currentPost = data[nr];
  console.log('-------------------------'.magenta);
  console.log('numer postu: '.magenta + nr.toString().magenta);
  console.log('Autor: '.magenta.bold, currentPost.from.name.yellow);

  var content = currentPost.message;
  if (!full) {
    content = content.substr(0, 150) + '...';
  }
  console.log('Treść: '.bold.magenta + content.yellow);

  var likes = currentPost.likes ? currentPost.likes.data.length : 0;
  var comments = currentPost.comments ? currentPost.comments.data.length : 0;
  console.log(
    'Lajki: '.bold.magenta +
    likes.toString().yellow +
    '  |  Komentarze: '.bold.magenta +
    comments.toString().yellow
  );
  //console.log(currentPost);
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
