'use strict';

var inquirer = require('inquirer');

var inquirerPrompt;

var showGroupList = function(message, groups, cb) {
  closePrompt();

  inquirerPrompt = inquirer.prompt({
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

  inquirerPrompt = inquirer.prompt({
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

  inquirerPrompt = inquirer.prompt({
    message: message,
    type: 'input',
    name: 'value',
    validate: validator
  }, function(answer) {
    cb(answer);
  });
};



var closePrompt = function () {
  return inquirerPrompt && inquirerPrompt.rl && inquirerPrompt.rl.close();
};

module.exports = {
  showGroupList: showGroupList,
  showCheckBoxes: showCheckBoxes,
  showMenu: showMenu
};
