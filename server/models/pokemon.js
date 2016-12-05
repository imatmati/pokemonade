'use strict';
var async = require ("async");

module.exports = function(Pokemon) {

    Pokemon.thumbs = function (name, thumbUp, thumbDown, callback) {
        console.log ("name, thumbUp, thumbDown", name, thumbUp, thumbDown)
        async.waterfall([
            function (cb) {
                
                Pokemon.findById (name, cb)
            },
            function (pokemon, cb) {
                pokemon.thumbUp = thumbUp;
                pokemon.thumbDown = thumbDown;
                Pokemon.upsert (pokemon, function(err, result) {
                    callback(null);
                })
            }
            ]);
        
    }
    
    Pokemon.remoteMethod ("thumbs", {
        accepts: [ { arg: 'name', type: 'string'}, { arg: 'thumbUp', type: 'number'}, { arg: 'thumbDown', type: 'number'}]
    })
   
};
