var async = require('async');
var request = require('request');
var _ = require('lodash');

module.exports = function(app, Rooms, Users, _auth, spotifyApi){
  var spotifyService = require('../services/spotifyService')(spotifyApi);
  var bigMLService = require('../services/bigMLService')();
  var roomService = require('../services/roomService')(bigMLService, spotifyService);

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
        res.status(404).send({ message: 'Room not found.' });
      }
      res.send(room);
    });
  });

  app.post('/api/rooms/:id/subscribers', _auth, function(req, res, next){
    var id = req.params.id;
    var userId = req.body.user;
    Users.findOne({spotifyId: userId}, function(err, user){
      if(err) return next(err);
      if(!user) {
        res.status(404).send({ message: 'User not found.' });
      }
      Rooms
      .findById(id)
      .populate('subscribers')
      .exec(function(err, room) {
        if(err) return next(err);
        if(!room) {
          res.status(404).send({ message: 'Room not found.' });
        }
        if(_.some(room.subscribers, function(sub){
          return sub.spotifyId === userId
        }))
        {
          res.status(200).send(room);
        }
        else {
          room.subscribers.push(user.id);
          room.save(function(err, savedRoom){
            res.status(200).send(savedRoom);
          });
        }
      });
    });
  });

  app.delete('/api/rooms/:id/subscribers/:userId', _auth, function(req, res, next){
    var id = req.params.id;
    var userId = req.params.userId;
    Users.findOne({spotifyId: userId}, function(err, user){
      if(err) return next(err);
      if(!user) {
        res.status(404).send({ message: 'User not found.' });
      }
      Rooms
      .findById(id)
      .populate('subscribers')
      .exec(function(err, room) {
        if(err) return next(err);
        if(!room) {
          res.status(404).send({ message: 'Room not found.' });
        }
        room.subscribers.pull(user.id);
        room.save(function(err, savedRoom){
          res.status(200).send(savedRoom);
        });
      });
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
            var topTracks = _.map(room.topTracks, function(track){
              return {
                id: track.spotifyId,
                name: track.name,
                artist: track.artist
              }
            });
            callback(err, topTracks);
          }
          else {
            roomService.refreshTopTracks(dbRoom, callback);
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
        dbRoom.save(function(err, room){
          res.location('/api/rooms/' + room.id.toString());
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
}
