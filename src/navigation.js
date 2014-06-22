/*global require:false, console:false, module:false*/

var inquirer = require('inquirer');

var prompt;

var showGroupList = function(groups, cb) {
    closePrompt();
    
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
    closePrompt();
    
    prompt = inquirer.prompt({
        message: message,
        type: 'input',
        name: 'menu',
    }, function(answer) {
        cb(answer);
    });
};

var closePrompt = function () {
    return prompt && prompt.rl && prompt.rl.close();
};

module.exports = {
    showGroupList: showGroupList,
    showMenu: showMenu
};
