var async = require('async');
var request = require('request');
var _ = require('lodash');
const EventEmitter = require('events');

module.exports = function(app, Rooms, _auth, spotifyApi){
  var spotifyService = require('../services/spotifyService')(spotifyApi);
  var bigMLService = require('../services/bigMLService')();

  app.post('/api/rooms', _auth, function(req, res, next) {
    var Room = new Rooms({
      name: req.body.name,
      owner: req.user.dbId,
      subscribers: [req.user.dbId]
    }).save(function(err, nRoom){
      if (err) return next(err);
      res.location('/api/rooms/' + nRoom.id.toString());
      res.status(201).send(nRoom);
    });
  });

  app.get('/api/rooms/:id', function(req, res, next) {
    var id = req.params.id;
    Rooms.findById(id)
    .populate('subscribers')
    .exec(function(err, room) {
      if (err) return next(err);
      if (!room) {
        return res.status(404).send({ message: 'Room not found.' });
      }
      res.send(room);
    });
  });

  //I'd say this should be a put or post really..
  //Endpoint to generate tracks
  app.get('/api/rooms/:id/tracks', _auth, function(req, res, next) {
    var id = req.params.id;
    var dbRoom;
    var playlistTrackMap = new Map();
    async.waterfall([
//Either get the top tracks, or figure out the top tracks if the room hasn't been created yet
      function(callback) {
//get the room with all subscribers
        Rooms.findById(id)
        .populate('subscribers')
        .exec(function(err, room) {
          if(err) return next(err);
          if(!room) {
            return res.status(404).send({ message: 'Room not found.' });
          }
          dbRoom = room;
          var seedTracks = [];
          if(room.topTracks.length > 0) {
            seedTracks = room.topTracks;
            //these probabl have to be restructured
          }

          else {
//the room hasnt been set up yet,
//take all the top tracks from each user
//and run them against each other
//first get the all the top 3 tracks from the users
            _.forEach(room.subscribers, function(sub) {
              if(sub.tracks.length > 0) {
                var trackIds = _.map(
                  _.slice(sub.tracks, 0, 3),
                   function(track) {
                     return track.spotifyId;
                });
                seedTracks = _.concat(seedTracks, trackIds);
              }
            });
//get the features of these tracks
//we're gonna need these for predictions
            var tracksToPredict = [];
            //TODO make sure we dont go over the 100 limit
            var trackFeaturesUrl = 'https://api.spotify.com/v1/audio-features/?ids=' + seedTracks.join(',');
            request.get({
              url: trackFeaturesUrl,
              auth: {
                'bearer': spotifyApi.getAccessToken()
              }
            }, function(err, response, body) {
//the features need to be parsed into predictions
              var parsedTracks = JSON.parse(body);
              _.forEach(parsedTracks.audio_features, function(trackFeature) {
                tracksToPredict.push({
                  id: trackFeature.id,
                  features: {
                    'danceability': trackFeature.danceability,
                    'energy': trackFeature.energy,
                    'key': trackFeature.key,
                    'loudness': trackFeature.loudness,
                    'mode': trackFeature.mode,
                    'speechiness': trackFeature.speechiness,
                    'acousticness': trackFeature.acousticness,
                    'instrumentalness': trackFeature.instrumentalness,
                    'liveness': trackFeature.liveness,
                    'valence': trackFeature.valence,
                    'tempo': trackFeature.tempo,
                    'duration_ms': trackFeature.duration_ms,
                    'time_signature': trackFeature.time_signature
                  }
                });
              });
//for each track run it against each users model
//aggragate all of these and pick the best ones
              var userToTrackRatings = [];

              //using eachSeries because an each implementation overruns the max size of listeners
              //and I cant seem to be able to change that succesfully
              async.eachSeries(tracksToPredict, function(trackToPredict, callback){
                var trackRatings = [];
                async.eachSeries(room.subscribers, function(user, callback) {
                  var predictionUrl = 'https://bigml.io/prediction?username=wsnarski;api_key=1452dd3a9e3255121de7e2c788196d98dc9491c3';
                  var predictionOptions = {
                    method: 'post',
                    body: {input_data: trackToPredict.features, model:user.MLmodelUrl },
                    json: true,
                    url: predictionUrl
                  }
                  request(predictionOptions, function (err, res, body) {
                    if(err) return next(err);
                    trackRatings.push({
                      id: trackToPredict.id,
                      user:user.spotifyId,
                      prediction: body.output,
                      confidence: body.confidence
                    });
                    callback();
                  });
                }, function(err) {
                  if( err ) {
                    return next(err);
                  } else {
                    userToTrackRatings.push(trackRatings);
                    callback();
                  }
                });
              }, function(err){
                if( err ) {
                  return next(err);
                } else {
                  //doing this here instead of aggergating above
                  //because not certain what data we'll want to use
                  var trackAggregates = [];
                  _.forEach(userToTrackRatings, function(trackRatings){
                    var trackAggregate = {
                      id: trackRatings[0].id,
                      prediction:0,
                      confidence:0
                    }
                    _.forEach(trackRatings, function(track) {
                      trackAggregate.prediction += track.prediction;
                      trackAggregate.confidence += track.confidence;
                    });
                    trackAggregate.prediction /= trackRatings.length;
                    trackAggregate.confidence /= trackRatings.length;
                    trackAggregates.push(trackAggregate);
                  });
                  var sortedTrackAggregates = _.sortBy(trackAggregates, function(track) {
                    return -(track.score - track.confidence);
                  });
                  console.log('about to call recommend');
                  callback(err, _.take(sortedTrackAggregates, 3));
                }
              });
            });
          }
        });
      },
      //Get recommended tracks based on the top three seeds
      spotifyService.getRecommendedTracks,
      //Put the recommended tracks in a map for later use
      function(recommendedTracks, callback) {
        _.forEach(recommendedTracks, function(track){
          playlistTrackMap.set(track.id, {
            id: track.id,
            name: track.name,
            artist: track.artist
          });
        });
        callback(null, recommendedTracks);
      },
      //Get the audio features for the recommended tracks
      spotifyService.getTrackFeatures,
      //Add the dBRoom object for the predict call
      function(tracks, callback) {
        callback(null, {Room: dbRoom, Tracks: tracks});
      },
      //Predict the recommended tracks
      bigMLService.predictTracks,
      //Pass on the top 12 predicted tracks
      function(predictedTracks, callback) {
        callback(null, _.take(predictedTracks, 12));
      },
      //Save the current playlist and set any top tracks
      function(currentPlaylist, callback) {
        var currentTracks = [];
        console.log('setting current tracks');
        _.forEach(currentPlaylist, function(track){
          currentTracks.push({
            spotifyId: track.id,
            rating: track.prediction,
            confidence: track.confidence,
            name: playlistTrackMap.get(track.id).name,
            artistName: playlistTrackMap.get(track.id).artist
          })
        });

        //TODO improve top tracks
        dbRoom.topTracks = _.take(currentTracks, 3);
        dbRoom.currentTracks = currentTracks;
        console.log(dbRoom.currentTracks);
        dbRoom.save(function(err, room){
          res.send(room);
        });
      }
    ]);
  });

  app.get('/api/me/rooms', _auth, function(req, res, next) {
    Rooms.find({owner: req.user.dbId}, function(err, rooms) {
      if(err) return next(err);
      res.send(rooms);
    });
  });

  var spotifyReccomend = function(seedTracks, callback) {
    var seedIds = _.join(_.map(seedTracks, function(track) {
      return track.id;
    }), ',');
    var trackRecommendationsUrl = 'https://api.spotify.com/v1/recommendations?limit=50&seed_tracks=' + seedIds;
    request.get({
      url: trackRecommendationsUrl,
      auth: {
        'bearer': spotifyApi.getAccessToken()
      }
    }, function(err, response, body) {
      if(err) return next(err);
      var recs = JSON.parse(body);
      var trackInfo = _.map(recs.tracks, function(track) {
        return {
          id: track.id,
          name: track.name,
          artist: track.artists[0].name,
        }
      });
      callback(err, trackInfo);
    });
  };

}
