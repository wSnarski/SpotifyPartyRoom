var _ = require('lodash');
var request = require('request');
var async = require('async');

module.exports = function(spotifyApi){
    var module = {};
    /*
      input @seedTracks
      output @recommendedTracks
    */
    module.getRecommendedTracks = function(seedTracks, callback) {
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
    }
    /*

    */
    module.getTrackFeatures = function(recommendedTracks, callback) {
      //chunking into segments of 100 as max for api call is 100
      var chunkedTrackIds = _.chunk(
        _.map(recommendedTracks, function(track) { return track.id }),
       100);
      var trackAndFeatures = [];
      async.each(chunkedTrackIds, function(trackIdArr, callback) {
        var recString = _.join(trackIdArr, ',');
        var trackFeaturesUrl = 'https://api.spotify.com/v1/audio-features/?ids=' + recString;
        request.get({
          url: trackFeaturesUrl,
          auth: {
            'bearer': spotifyApi.getAccessToken()
          }
        }, function(err, response, body) {
          if(err) callback(err);
          var trackFeatures = JSON.parse(body).audio_features;
          _.forEach(trackFeatures, function(trackFeature) {
            trackAndFeatures.push({
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
          callback();
        });
      }, function(err) {
        if(err) callback(err);
        callback(null, trackAndFeatures);
    });
  }
  return module;
}
