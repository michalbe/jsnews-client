var inquirer = require('inquirer');

var prompt;

var showMenu = function(message, cb) {
    prompt && prompt.rl && prompt.rl.close();
    
    prompt = inquirer.prompt({
        message: message,
        type: 'input',
        name: 'menu',
    }, function(answer) {
        cb(answer);
    });
};

module.exports = {
    showMenu: showMenu
};
