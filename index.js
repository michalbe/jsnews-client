var config = require('./config');

var FB = require('fb');

var groupId = ['217169631654737'];

var FB = require('fb');

FB.api('oauth/access_token', {
    client_id: config.client_id,
    client_secret: config.client_secret,
    grant_type: 'client_credentials'
}, function (res) {
    if(!res || res.error) {
        console.log(!res ? 'error occurred' : res.error);
        return;
    }

    var accessToken = res.access_token;
    FB.api('/' + groupId[0] + '/feed?access_token='+accessToken, function (res) {
      if(!res || res.error) {
       console.log(!res ? 'error occurred' : res.error);
       return;
      }
      console.log(res.data[0].comments);
    });
});
