var request = require('request');
var _ = require('lodash');
var async = require('async');

module.exports = function(app, Users, _auth, spotifyApi){
  var bigMLService = require('../services/bigMLService')();

  //this endpoint can be used to get
  //all the tracks for a user
  //or get the spotify top tracks
  app.get('/api/me/tracks', _auth, function(req,res,next) {
    if(req.query.refresh) {
      //TODO get all three time spans of top tracks, SHORT, MEDIUM, LONG (more tracks)
      request.get({ url: 'https://api.spotify.com/v1/me/top/tracks?limit=50', auth: {
        'bearer': req.user.accessToken
      }
    }, function(err, response, body) {
      var jsonBody = JSON.parse(body);
      var items = _.map(jsonBody.items, function(item,index) {
        //since we are pulling new tracks from spotify
        //we don't have explicit ratings on them
        let rating = 3
        if(index < 10 ) {
          rating = 5
        } else if (index < 40) {
          rating = 4
        }
        return {
          artistName: item.artists[0].name,
          spotifyId: item.id,
          name: item.name,
          rank: index,
          rating: rating
        }
      });
      res.status(200).send(items);
    });
  }
  //TODO add to db and get from db if the next call is a put, but if post we dont want to....
  });



  //     when a user posts ratings the following occurs
  //     add the rated tracks to the user
  //     get all rated tracks from user
  //     pull features of all tracks from spotify (since currently not storing that as it probably changes)
  //     send them over to BigML to recreate our sources/sets/models
  //     add the urls of these items to our user object
  //     delete the old ML items so we dont run out of space
  app.post('/api/tracks', _auth, function(req,res,next){
    var userId = req.user.dbId;
    var waterfallObj = {};
    async.waterfall([
      //add track ratings to user
      function(callback) {
        Users.findById(userId, function(err, user) {
          var tracksToInsert = _.map(req.body, function(track){
            return {
              spotifyId: track.spotifyId,
              rating: track.rating
            }
          });
          //TODO this will effectively dissalow people from changing their ratings on tracks
          user.tracks = _.uniqBy(_.concat(user.tracks, tracksToInsert), 'spotifyId');
          user.save(function(err, user) {
            callback(err, user)
          });
        });
      },
      //get track features for all tracks
      function(user, callback) {
        //TODO check to make sure we're not exceeding 100 track limit
        var trackMap = new Map();
        _.forEach(user.tracks, function(track) { if(track.spotifyId) trackMap.set(track.spotifyId,track.rating) });
        var trackIds = _.join(_.map(user.tracks, function(track) { return track.spotifyId } ), ',');
        var trackFeaturesUrl = 'https://api.spotify.com/v1/audio-features/?ids=' + trackIds;
        request.get({
          url: trackFeaturesUrl,
          auth: {
            'bearer': spotifyApi.getAccessToken()
          }
        }, function(err, response, body) {
          var featureString = 'danceability,energy,key,loudness,mode,speechiness,acousticness,instrumentalness,liveness,valence,tempo,duration_ms,time_signature,rating';
          var parsedTracks = JSON.parse(body);
          _.forEach(parsedTracks.audio_features, function(trackFeature) {
            if(trackFeature) {
              featureString = featureString.concat(
                '\n',
                trackFeature.danceability, ',',
                trackFeature.energy, ',',
                trackFeature.key, ',',
                trackFeature.loudness, ',',
                trackFeature.mode, ',',
                trackFeature.speechiness, ',',
                trackFeature.acousticness, ',',
                trackFeature.instrumentalness, ',',
                trackFeature.liveness, ',',
                trackFeature.valence, ',',
                trackFeature.tempo, ',',
                trackFeature.duration_ms, ',',
                trackFeature.time_signature, ',',
                trackMap.get(trackFeature.id));
              }
            });
            waterfallObj = {
              user: user,
              tracks: featureString
            };
            callback(err, featureString);
          });
        },
        bigMLService.createDataSource,
        function(dataSource, callback) {
          waterfallObj.dataSource = dataSource,
          callback(null, waterfallObj.dataSource);
        },
        bigMLService.createDataSet,
        function(dataSet, callback) {
          waterfallObj.dataSet = dataSet,
          callback(null, waterfallObj.dataSet);
        },
        bigMLService.createModel,
        function(model, callback) {
          waterfallObj.model = model,
          callback(null, waterfallObj);
        },
        function(waterfallObj, callback) {
          var user = waterfallObj.user;
          var needDel = user.MLsourceUrl;
          if(needDel) {
            waterfallObj.delprops = {
              source: user.MLsourceUrl,
              dataset: user.MLdatasetUrl,
              mode: user.MLmodelUrl
            };
          }
          user.MLsourceUrl = waterfallObj.dataSource;
          user.MLdatasetUrl = waterfallObj.dataSet;
          user.MLmodelUrl = waterfallObj.model;
          user.save(function(err, user) {
            if(needDel) {
              callback(null, waterfallObj);
            } else {
              res.send(user);
            }
          });
        },
        function(waterfallObj, callback) {
          async.parallel([
            function(callback) {
              var delSourceUrl = 'https://bigml.io/' + waterfallObj.delprops.source;
              var delSourceOptions = {
                method: 'delete',
                url: delSourceUrl
              }
              request(delSourceOptions, function (err, res, body) {
                callback(res);
              });
            },
            function(callback) {
              var delSetUrl = 'https://bigml.io/' + waterfallObj.delprops.dataset;
              var delSetOptions = {
                method: 'delete',
                url: delSetUrl
              }
              request(delSetOptions, function (err, res, body) {
                callback(res);
              });
            },
            function(callback) {
              var delModelUrl = 'https://bigml.io/' + waterfallObj.delprops.model;
              var delModelOptions = {
                method: 'delete',
                url: delModelUrl
              }
              request(delModelOptions, function (err, res, body) {
                callback(res);
              });
            }
            ], function(err, results) {
              res.send(waterfallObj.user);
            });
          }
        ]);
      });
}
