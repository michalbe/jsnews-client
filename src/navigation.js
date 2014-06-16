var readline = require('readline');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var showMenu = function(title, cb) {
  rl.question(title.magenta.bold, function(answer) {
    cb(answer);
  });
};

module.exports = {
  showMenu: showMenu
}
