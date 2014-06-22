/*global require:false, console:false, module:false*/

var inquirer = require('inquirer');

var prompt;

var showGroupList = function(groups, cb) {
    inquirer.prompt({
        message: 'Wybierz grupę',
        type: 'list',
        name: 'currentGroup',
        choices: groups
    }, function (answer) {
        cb(answer); 
    });
};

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
    showGroupList: showGroupList,
    showMenu: showMenu
};
