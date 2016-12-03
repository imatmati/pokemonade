'use strict';
var Twitter = require('twitter');
 
var client = new Twitter({
  consumer_key: 'cIanIXE9zk9hxD0CewwgBTQHl',
  consumer_secret: 'VpJO50Gks3iOSQLkUKdgOD59qJcxeNea0sHtxjJv5x98TCh08u',
  access_token_key: '735129973544095744-6lA0asmCKYEBZXmf8YUTNk96XVCTgYV',
  access_token_secret: 'Qog6HrLHvSiBbwR1gd2ea4G0zK9UpkwiqWfdqqt2iVJxH'
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
