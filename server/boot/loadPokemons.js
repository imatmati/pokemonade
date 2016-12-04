var async = require('async');
var Client = require('node-rest-client').Client;
var client = new Client();

module.exports = function(app) {

    var mongoDs = app.dataSources.mongo;
    
    var comptePokemons = function(callback) {
        // get pokemons count
        console.log("chargement du compte de pokemons");
        client.get("http://pokeapi.co/api/v2/pokemon/?limit=1", function(data, response) {

            callback(null, data.count);
        });

    };

    var chargementPokemons = function(count, callback) {
        console.log("chargement de la liste complète de pokemons");
        // get pokemons list
        client.get("http://pokeapi.co/api/v2/pokemon/?limit=" + count, function(data, response) {

            callback(null, data.results);
        });

    }

    var chargementInfosPokemons = function(pokemons, callback) {
        console.log("chargement des informations de pokemons");
        // get pokemons info
        var results = [];

        var worker = function(name, cb) {
            client.get("http://pokeapi.co/api/v2/pokemon/" + name + "/", function(data, response) {
                results.push(data);
                cb();
            });
        };


        var q = async.queue(function(data, callback) {
            worker(data, callback);
        }, 8);


        pokemons.forEach(function(pokemon) {
            q.push(pokemon.name)
        });
        q.drain = function() {
            callback(null, results);
        }
    }
    var insertPokemons = function(pokemonsComplete, callback) {
        console.log("sauvegarde des informations de pokemons");
        var tmp = "";
        var pokemonsToInsert = pokemonsComplete.map(function(pokemon) {
            var poke =  {
                weight: pokemon.weight,
                name: pokemon.name,
                stats: pokemon.stats,
                types: pokemon.types,
                base_experience: pokemon.base_experience,
                sprites: pokemon.sprites

            };
            tmp+=JSON.stringify(poke);
            return poke;
        });

        console.log ("================ TO INSERT ====================== "+tmp)

        mongoDs.automigrate('Pokemon', function(err) {
            if (err) return console.log(err);

            var Pokemon = app.models.Pokemon;
            Pokemon.create(pokemonsToInsert, function(err, obj) {
                console.log ("err",err);
                console.log ("obj",obj);
                callback(null, obj);
            });
        });


    };

    var statsPokemons = function(pokemons,callback) {
        console.log("sauvegarde des stats de types de pokemons");
        var dataByType = {};
        //collecte des infos par type
        pokemons.forEach(function(pokemon) {
            pokemon.types.forEach(function(data) {
                var type = data.type.name;
                if (!dataByType[type]) {
                    dataByType[type] = [{
                        stats: pokemon.stats
                    }];
                }
                else {
                    dataByType[type].push({
                        stats: pokemon.stats
                    });
                }
            })
        });
        /*
        dataByType {  poison: [ { stats: [Object] }, { stats: [Object] }, { stats: [Object] } ],
        			  grass: [ { stats: [Object] }, { stats: [Object] }, { stats: [Object] } ],
        			  fire: [ { stats: [Object] }, { stats: [Object] }, { stats: [Object] } ],
        			  flying: [ { stats: [Object] } ] 
        }

        */
        // calcul des stats
        var stats = {};
        var typeStat = {};
        Object.keys(dataByType).forEach(function(type) {
            typeStat[type] = {};
            // [ { stats: [Object] }, { stats: [Object] }, { stats: [Object] } ]

            dataByType[type].forEach(function(data) {

                data.stats.forEach(function(d) {
                    var name = d.stat.name;
                    var value = d.base_stat;

                    if (!typeStat[type][name]) {
                        typeStat[type][name] = {
                            count: 1,
                            val: value
                        };
                    }
                    else {
                        var precedent = typeStat[type][name];
                        precedent.count += 1;
                        precedent.val += value;
                    }
                });
            });
            /*
            typeStat {"poison":{"speed":{"count":3,"val":185},"special-defense":{"count":3,"val":245},"special-attack":{"count":3,"val":245},"defense":{"count":3,"val":195},"attack":{"count":3,"val":193},"hp":{"count":3,"val":185}},
            		  "grass":{"speed":{"count":3,"val":185},"special-defense":{"count":3,"val":245},"special-attack":{"count":3,"val":245},"defense":{"count":3,"val":195},"attack":{"count":3,"val":193},"hp":{"count":3,"val":185}},
            		  "fire":{"speed":{"count":3,"val":245},"special-defense":{"count":3,"val":200},"special-attack":{"count":3,"val":249},"defense":{"count":3,"val":179},"attack":{"count":3,"val":200},"hp":{"count":3,"val":175}},
            		  "flying":{"speed":{"count":1,"val":100},"special-defense":{"count":1,"val":85},"special-attack":{"count":1,"val":109},"defense":{"count":1,"val":78},"attack":{"count":1,"val":84},"hp":{"count":1,"val":78}}}
            */

        });

        //calcul des stats
        Object.keys(typeStat).forEach(function(type) {

            //{"speed":{"count":3,"val":185},"special-defense":{"count":3,"val":245},"special-attack":{"count":3,"val":245},"defense":{"count":3,"val":195},"attack":{"count":3,"val":193},"hp":{"count":3,"val":185}},
            var data = typeStat[type]
            Object.keys(data).forEach(function(statName /*speed*/ ) {
                // {"count":3,"val":185}
                var statBeforeMean = data[statName];
                var statsForType = stats[type] || {};
                statsForType[statName] = Math.round(statBeforeMean.val / statBeforeMean.count);
                stats[type] = statsForType;

            });

        });
        console.log ("stats",stats);
        mongoDs.automigrate('Stat', function(err) {
            if (err) return console.log(err);

            var Stat = app.models.Stat;
            Stat.create({data:stats}, callback);
        });

    }

    if (process.env.RELOAD_POKEMON === 'REMOTE') {
        console.log ("chargement distant");
        async.waterfall([comptePokemons, chargementPokemons, chargementInfosPokemons, insertPokemons, statsPokemons],
            function(err, result) {
                if (err) {
                    console.log("Erreur", err);
                    process.exit(1);
                }
                console.log("Chargement effectué");
            }
    
        );

    }
    else if (process.env.RELOAD_POKEMON === 'LOCAL') {
       console.log ("chargement local");
       async.waterfall([function (callback){
            var pokemonsToInsert = require ("../pokemon.json");
            console.log (pokemonsToInsert);
           callback(null,pokemonsToInsert)},insertPokemons, statsPokemons ], function (err, results) {
               if (err) return console.log (err);
               console.log("Chargement effectué");
       });
    }

}