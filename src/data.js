/*global require:false, console:false, module:false*/

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

        var group = 0;
        var accessToken = res.access_token;
        
        var setGroup = function (groupID) {
            group = groupID;
        };
        
        var getWall = function (callback) {
            FB.api('/' + group + '/feed?limit=' + config.maxPosts + '&access_token='+accessToken, function (res) {
                if(!res || res.error) {
                    cb(!res ? 'error occurred' : res.error);
                    return;
                }
                callback(null, res.data);
            });
        };
        
        var getPost = function (id, callback) {
            FB.api(id + '?access_token='+accessToken, function (res) {
                if(!res || res.error) {
                    cb(!res ? 'error occurred' : res.error);
                    return;
                }
                callback(null, res);
            });
        };
        
        cb(null, {
            getWall: getWall,
            getPost: getPost,
            setGroup: setGroup
        });
    });
};
