var _ = require('lodash');
var request = require('request');
var async = require('async');

module.exports = function(){
  var module = {};

  module.createDataSource = function(inlineData, callback) {
    var dataSource = "";
    var currentCode = 1;
    var sourceUrl = 'https://bigml.io/source?username=wsnarski;api_key=1452dd3a9e3255121de7e2c788196d98dc9491c3';
    var sourceOptions = {
      method: 'post',
      body: {"data": inlineData, name:'testInline'},
      json: true,
      url: sourceUrl
    };
    request(sourceOptions, function (err, res, body) {
      currentCode = body.status.code;
      dataSource = body.resource;
      if(currentCode == 5) {
        callback(err, dataSource);
      } else {
        //TODO this should be buffered
        async.doUntil(
          function(callback) {
            var sourceUrl = 'https://bigml.io/'+dataSource+'?username=wsnarski;api_key=1452dd3a9e3255121de7e2c788196d98dc9491c3';
            var sourceOptions = {
              method: 'get',
              json: true,
              url: sourceUrl
            };
            request(sourceOptions, function (err, res, body) {
              currentCode = body.status.code;
              callback(err, dataSource);
            });
          },
          function() {
            return currentCode == 5
          },
          callback
        );
      }
    });
  }

  module.createDataSet = function(dataSource, callback) {
    var currentCode = 1;
    var dataSet = "";
    var datasetUrl = 'https://bigml.io/dataset?username=wsnarski;api_key=1452dd3a9e3255121de7e2c788196d98dc9491c3';
    var datasetOptions = {
      method: 'post',
      body: {"source": dataSource, name:'testInline'},
      json: true,
      url: datasetUrl
    }
    request(datasetOptions, function (err, res, body) {
      currentCode = body.status.code;
      dataSet = body.resource;
      if(currentCode == 5) {
        callback(err, dataSet);
      } else {
        //TODO this should be buffered
        async.doUntil(
          function(callback) {
            var setUrl = 'https://bigml.io/'+dataSet+'?username=wsnarski;api_key=1452dd3a9e3255121de7e2c788196d98dc9491c3';
            var setOptions = {
              method: 'get',
              json: true,
              url: setUrl
            };
            request(setOptions, function (err, res, body) {
              currentCode = body.status.code;
              callback(err, dataSet);
            });
          },
          function() {
            return currentCode == 5
          },
          callback
        );
      }
    });
  }

  module.createModel = function(dataSet, callback) {
    var currentCode = 1;
    var model = "";
    var modelUrl = 'https://bigml.io/model?username=wsnarski;api_key=1452dd3a9e3255121de7e2c788196d98dc9491c3';
    var modelOptions = {
      method: 'post',
      body: {"dataset": dataSet, name:'testInline'},
      json: true,
      url: modelUrl
    }
    request(modelOptions, function (err, res, body) {
      currentCode = body.status.code;
      model = body.resource
      if(currentCode == 5) {
        callback(err, model);
      } else {
        //TODO this should be buffered
        async.doUntil(
          function(callback) {
            var modelUrl = 'https://bigml.io/'+model+'?username=wsnarski;api_key=1452dd3a9e3255121de7e2c788196d98dc9491c3';
            var modelOptions = {
              method: 'get',
              json: true,
              url: modelUrl
            };
            request(modelOptions, function (err, res, body) {
              currentCode = body.status.code;
              callback(err, model);
            });
          },
          function() {
            return currentCode == 5
          },
          callback
        );
      }
    });
  }


  /*
    input @predictObject
   {
     Room: dbRoom,
     Tracks: [
      {
        id: String,
        features: {
           danceability: 5,
           ...
           time_signature: 4
        }
      },
    ]
   }
    output @sortedPredictedTracks
    [
      {
        id: 34qioaeo32
        prediction: 4
        confidence: .23
      },
    ]
  */
  module.predictTracks =  function(predictObject, callback) {
    var userToTrackRatings = [];
    //using eachSeries because an each implementation overruns the max size of listeners
    //and I cant seem to be able to change that succesfully
    async.eachSeries(predictObject.Tracks, function(trackToPredict, callback){
      var trackRatings = [];
      async.eachSeries(predictObject.Room.subscribers, function(user, callback) {
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
          callback(err);
        } else {
          userToTrackRatings.push(trackRatings);
          callback();
        }
      })
    }, function(err){
      if( err ) {
        callback(err);
      } else {
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
          return -(track.prediction - track.confidence);
        });
        callback(err, sortedTrackAggregates);
      }
    })
  }

  return module;
}
