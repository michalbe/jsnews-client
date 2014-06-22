/*global require:false, console:false, module:false*/

var inquirer = require('inquirer');

var prompt;

var showGroupList = function(message, groups, cb) {
    closePrompt();
    
    prompt = inquirer.prompt({
        message: message,
        type: 'list',
        name: 'option',
        choices: groups
    }, function (answer) {
        cb(answer); 
    });
};

var showCheckBoxes = function (message, choices, cb) {
    closePrompt();

    choices.push(new inquirer.Separator());
    choices.push({name: 'Usuń wszystkie', value: 'all'});
    choices.push({name: 'Wróć', value: 'back'});
    
    prompt = inquirer.prompt({
        message: message,
        type: 'checkbox',
        name: 'list',
        choices: choices,
    }, function( answers ) {
        cb(answers);
    });
};

var showMenu = function(message, cb, validator) {
    closePrompt();
    
    prompt = inquirer.prompt({
        message: message,
        type: 'input',
        name: 'value',
        validate: validator
    }, function(answer) {
        cb(answer);
    });
};



var closePrompt = function () {
    return prompt && prompt.rl && prompt.rl.close();
    prompt = false;
};

module.exports = {
    showGroupList: showGroupList,
    showCheckBoxes: showCheckBoxes,
    showMenu: showMenu
};
