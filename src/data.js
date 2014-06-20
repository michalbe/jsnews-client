var config = require('./config');
var FB = require('fb');

module.exports = function(cb){
  FB.api('oauth/access_token', {
    client_id: config.client_id,
    client_secret: config.client_secret,
    grant_type: 'client_credentials'
  }, function (res) {
    if(!res || res.error) {
      cb(!res ? 'error occurred' : res.error);
      return;
    }

    var accessToken = res.access_token;
    FB.api('/' + config.groups[0] + '/feed?limit=' + config.maxPosts + '&access_token='+accessToken, function (res) {
      if(!res || res.error) {
          cb(!res ? 'error occurred' : res.error);
          return;
      }
      cb(null, res.data);
    });

  });
}
