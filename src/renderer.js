var colors = require('colors');
var data;

var setData = function(d) {
  data = d;
}

var clearScreen = function(){
  console.log("\u001b[2J\u001b[0;0H");
}

var numberOfPosts = function() {
  var posts = 'Ilość postów: '.magenta.bold + data.length.toString().yellow;
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
  console.log(currentPost);
}

var all = function() {
  clearScreen();
  numberOfPosts();
  post(4);
}

module.exports = {
  setData: setData,
  all: all
}
