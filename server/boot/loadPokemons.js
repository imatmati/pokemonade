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
        client.get("http://pokeapi.co/api/v2/pokemon/?limit=6", function(data, response) {

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

        var pokemonsToInsert = pokemonsComplete.map(function(pokemon) {
            return {
                weight: pokemon.weight,
                name: pokemon.name,
                stats: pokemon.stats,
                types: pokemon.types,
                base_experience: pokemon.base_experience,
                sprites: pokemon.sprites

            };
        });



        mongoDs.automigrate('Pokemon', function(err) {
            if (err) return console.log(err);

            var Pokemon = app.models.Pokemon;
            Pokemon.create(pokemonsToInsert, callback);
        });


    };

    var statsPokemons = function(pokemons, callback) {
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


        // calcul des stats
        var stats =[] ;
        var types = Object.keys(dataByType);
        var typeStat = {};
        types.forEach(function(type) {
            var listStats = dataByType[type];
            typeStat[type]={};
            listStats.forEach(function (data) {
              data.forEach (function (d){        
                  var name = d.stat.name; 
                  var value = d.base_stat;
                  if (!typeStat[type][name]) {
                      typeStat[type][name] = name;
                      typeStat[type][name+"Cnt"] = 1;
                      
                  }
                  else {
                      
                      typeStat[type][name+"Cnt"] +=  1;
                  }
              });
            });
            
        });
        
        mongoDs.automigrate('Stat', function(err) {
            if (err) return console.log(err);

            var Stat = app.models.Stat;
            Stat.create(stats, callback);
        });


    }

    async.waterfall([comptePokemons, chargementPokemons, chargementInfosPokemons, insertPokemons],
        function(err, result) {
            if (err) {
                console.log("Erreur", err);
                process.exit(1);
            }
            console.log("Chargement effectué");
        }

    );



}
