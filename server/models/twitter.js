'use strict';
var Twitter = require('twitter');

var client = new Twitter({
  consumer_key: 'YourOwn',
  consumer_secret: 'YourOwn',
  access_token_key: 'YourOwn',
  access_token_secret: 'YourOwn'
});



module.exports = function(Twitter) {

    Twitter.findByName = function(name,cb) {
        client.get('search/tweets', {q: '#'+name}, function(error, tweets, response) {
            cb(error,tweets);
        });
    }
    
    Twitter.remoteMethod("findByName", {
        accepts: {arg: 'name', type:'string'},
        returns: {arg: 'tweets', type:'object'},
        http: {
            verb: 'get',
            path: '/'
        }
       
    })
    
};
