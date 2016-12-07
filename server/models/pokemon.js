'use strict';
var async = require ("async");

module.exports = function(Pokemon) {
    
    
    Pokemon.likes = function (callback) {
        Pokemon.find({where: {
           "$or":[ {thumbUp : { '$gt' : 0 }}, {thumbDown : { '$gt' : 0 }}]
        }},function(err, result) {
            var ret = result.map(function (pokemon) {
                return {
                    name : pokemon.name,
                    img : pokemon.sprites.front_default,
                    thumbUp: pokemon.thumbUp ? pokemon.thumbUp : 0,
                    thumbDown : pokemon.thumbDown ? pokemon.thumbDown : 0
                }  
            })
            callback(null,ret);
        })
    }

    Pokemon.remoteMethod ("likes", {
        returns: {arg: 'likes', type: 'array'}, http : { verb : 'get'}
    })
    Pokemon.thumbs = function (name, thumbUp, thumbDown, callback) {
       
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
    
    Pokemon.names = function (callback) {
        Pokemon.find({ fields: {name: true} },
        function(err, result) {
            var ret = result.map(function (data) {
                return data.name;
            })
            callback(null,ret);
        })
    }
    Pokemon.remoteMethod ("names", {
       returns: {arg: 'names', type: 'array'}, http : { verb : 'get'}
    })
};
