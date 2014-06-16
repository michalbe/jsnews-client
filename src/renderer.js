var colors = require('colors');
var data;

var setData = function(d) {
  data = d;
}

var clearScreen = function(){
  console.log("\u001b[2J\u001b[0;0H");
}

var all = function() {
  clearScreen();
  numberOfPosts();
}

var numberOfPosts = function() {
  var posts = 'Ilość postów: ' + data.length;
  console.log(posts.toString().magenta.bold);
}

module.exports = {
  setData: setData,
  all: all,
}
