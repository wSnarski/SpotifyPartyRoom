var _ = require('lodash');
var request = require('request');
var async = require('async');

module.exports = function(bigMLService, spotifyService){
  var module = {};

  module.refreshTopTracks = function(room, callback) {
    async.waterfall([
      function(callback) {
        var seedTracks = [];
        _.forEach(room.subscribers, function(sub) {
          if(sub.tracks.length > 0) {
            seedTracks =
            _.concat(seedTracks,
                    _.map(
                      _.slice(sub.tracks, 0, 3),
                    function(track) {
                      return { id: track.spotifyId }
                    }));
          }
        });
        callback(null, seedTracks);
      },
      spotifyService.getTrackFeatures,
      function(tracksAndFeatures, callback) {
        var predictObj = {
          Room: room,
          Tracks: tracksAndFeatures
        }
        callback(null, predictObj);
      },
      bigMLService.predictTracks,
      function(trackPredictions, callback) {
        callback(null, _.take(trackPredictions, 3));
      }
    ], callback);
  }

  return module;
}
