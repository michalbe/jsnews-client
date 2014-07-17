'use strict';

function trim(string, length) {
  if (typeof string !== 'string') {
    return '';
  }
  return string.length > length ? string.substr(0, length) + '...' : string;
}

module.exports = {
  trim: trim
};
