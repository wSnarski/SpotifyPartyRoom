require('babel/register');

var async = require('async');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var React = require('react');
var ReactDOM = require('react-dom/server');
var Router = require('react-router');
var routes = require('./app/routes');
var swig = require('swig');
var mongoose = require('mongoose');
var bigml = require('bigml');
var passport = require('passport');
var path = require('path');
var _ = require('lodash');
var SpotifyStrategy = require('passport-spotify').Strategy;
var config = require('./config');
var Users = require('./models/Users');
var Rooms = require('./models/Rooms');
var session = require('express-session');
var request = require('request');
var logger = require('morgan');
var SpotifyApi = require('spotify-web-api-node');

//TODO move these to constants.js
var client_id = 'dcb418aa5f3844a2937a686e11e1f942';
var client_secret = '1e3b7d5b12184dbd94a6a80e00c8fdfc';

var spotifyApi = new SpotifyApi({
  clientId: client_id,
  clientSecret: client_secret
});

spotifyApi.clientCredentialsGrant()
.then(function(data) {
  // Save the access token so that it's used in future calls
  spotifyApi.setAccessToken(data.body['access_token']);
}, function(err) {
  console.log('Something went wrong when retrieving an access token', err);
});

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new SpotifyStrategy({
  clientID: 'dcb418aa5f3844a2937a686e11e1f942',
  clientSecret: '1e3b7d5b12184dbd94a6a80e00c8fdfc',
  callbackURL: 'https://quiet-beyond-64822.herokuapp.com/auth/callback'
},
function(accessToken, refreshToken, profile, done) {
  //Find the user in the db if they exist,
  //Create them if not
  Users.findOne({ spotifyId: profile.id }, function (err, dbUser) {
    if(err) done(err);
    var user = {
      dbId: '',
      accessToken: accessToken
    };
    if(!dbUser) {
      var newUser = new Users({
        spotifyId: profile.id
      });
      newUser.save(function(err, nUser){
        if (err) return done(err);
        user.dbId = nUser.id.toString();
        return done(null, user);
      });
    }
    else {
      user.dbId = dbUser.id.toString();
      return done(null, user);
    }
  });
}
));

mongoose.connect(config.database);

mongoose.connection.on('error', function() {
  console.info('Error: Could not connect to MongoDB. Did you forget to run `mongod`?');
});

var app = express();

app.set('port', process.env.PORT || 4000);
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'keyboard cat' }));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));



app.get('/auth',
passport.authenticate('spotify', {scope: ['user-read-email', 'user-read-private', 'user-top-read'], showDialog: true}),
function(req, res){
  // The request will be redirected to spotify for authentication, so this
  // function will not be called.
});

// GET /auth/spotify/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request. If authentication fails, the user will be redirected back to the
//   login page. Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/callback',
passport.authenticate('spotify', { failureRedirect: '/' }),
function(req, res) {
  res.redirect('/');
});

app.get('/api/me', ensureAuthenticated, function(req, res) {
  request.get('https://api.spotify.com/v1/me', {
    'auth': {
      'bearer': req.user.accessToken
    }
  })
  .on('response', function(response, body){
    response.on('data', function (body) {
      res.status(200).send(body);
    });
  });
});
//this endpoint can be used to get
//all the tracks for a user
//or get the spotify top tracks
app.get('/api/me/tracks', ensureAuthenticated, function(req,res,next) {
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
          id: item.id,
          name: item.name,
          rank: index,
          rating: rating
         }
        });
      res.status(200).send(items);
    });
  }
  //TODO add to db and get from db if the next call is a put, but if post we dont want to....
  //res.status(200).send();
});


//TODO when we get a rooms tracks we want to get rating the users already put on some tracks

//TODO when a user posts ratings the following occurs
//     add the rated tracks to the user
//     get all rated tracks from user
//     pull features of all tracks from spotify (since currently not storing that as it probably changes)
//     send them over to BigML to recreate our sources/sets/models
//     add the urls of these items to our user object
//     delete the old ML items so we dont run out of space
app.post('/api/tracks', ensureAuthenticated, function(req,res,next){
  var userId = req.user.dbId;
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
        var waterfallObj = {
          user: user,
          tracks: featureString
        };
        callback(err, waterfallObj);
      });
    },
    function(waterfallObj, callback) {
      var currentCode = 1;
      var sourceUrl = 'https://bigml.io/source?username=wsnarski;api_key=1452dd3a9e3255121de7e2c788196d98dc9491c3';
      var sourceOptions = {
        method: 'post',
        body: {"data": waterfallObj.tracks, name:'testInline'},
        json: true,
        url: sourceUrl
      };
      request(sourceOptions, function (err, res, body) {
        currentCode = body.status.code;
        waterfallObj.dataSource = body.resource;
        if(currentCode == 5) {
          callback(err, waterfallObj);
        } else {
          //TODO this should be buffered
          async.doUntil(
            function(callback) {
              var sourceUrl = 'https://bigml.io/'+waterfallObj.dataSource+'?username=wsnarski;api_key=1452dd3a9e3255121de7e2c788196d98dc9491c3';
              var sourceOptions = {
                method: 'get',
                json: true,
                url: sourceUrl
              };
              request(sourceOptions, function (err, res, body) {
                currentCode = body.status.code;
                callback(err, waterfallObj);
              });
            },
            function() {
              return currentCode == 5
            },
            callback
          );
        }
      });
    },
    function(waterfallObj, callback) {
      var currentCode = 1;
      var datasetUrl = 'https://bigml.io/dataset?username=wsnarski;api_key=1452dd3a9e3255121de7e2c788196d98dc9491c3';
      var datasetOptions = {
        method: 'post',
        body: {"source": waterfallObj.dataSource, name:'testInline'},
        json: true,
        url: datasetUrl
      }
      request(datasetOptions, function (err, res, body) {
        currentCode = body.status.code;
        waterfallObj.dataSet = body.resource;
        if(currentCode == 5) {
          callback(err, waterfallObj);
        } else {
          //TODO this should be buffered
          async.doUntil(
            function(callback) {
              var setUrl = 'https://bigml.io/'+waterfallObj.dataSet+'?username=wsnarski;api_key=1452dd3a9e3255121de7e2c788196d98dc9491c3';
              var setOptions = {
                method: 'get',
                json: true,
                url: setUrl
              };
              request(setOptions, function (err, res, body) {
                currentCode = body.status.code;
                callback(err, waterfallObj);
              });
            },
            function() {
              return currentCode == 5
            },
            callback
          );
        }
      });
    },
    function(waterfallObj, callback) {
      var currentCode = 1;
      var modelUrl = 'https://bigml.io/model?username=wsnarski;api_key=1452dd3a9e3255121de7e2c788196d98dc9491c3';
      var modelOptions = {
        method: 'post',
        body: {"dataset": waterfallObj.dataSet, name:'testInline'},
        json: true,
        url: modelUrl
      }
      request(modelOptions, function (err, res, body) {
        currentCode = body.status.code;
        waterfallObj.model = body.resource
        if(currentCode == 5) {
          callback(err, waterfallObj);
        } else {
          //TODO this should be buffered
          async.doUntil(
            function(callback) {
              var modelUrl = 'https://bigml.io/'+waterfallObj.model+'?username=wsnarski;api_key=1452dd3a9e3255121de7e2c788196d98dc9491c3';
              var modelOptions = {
                method: 'get',
                json: true,
                url: modelUrl
              };
              request(modelOptions, function (err, res, body) {
                currentCode = body.status.code;
                callback(err, waterfallObj);
              });
            },
            function() {
              return currentCode == 5
            },
            callback
          );
        }
      });
    },
    function(waterfallObj, callback) {
        var user = waterfallObj.user;
        var needDel = user.MLsourceUrl;
        user.MLsourceUrl = waterfallObj.dataSource;
        user.MLdatasetUrl = waterfallObj.dataSet;
        user.MLmodelUrl = waterfallObj.model;
        user.save(function(err, user) {
          if(needDel) {
            waterfallObj.delprops = {
              source: user.MLsourceUrl,
              dataset: user.MLdatasetUrl,
              mode: user.MLmodelUrl
            };
            callback(err, waterfallObj);
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


/*return {
  albumName: item.album.name,
  album: item.album.id,
  artistName: item.artists[0].name,
  artist: item.artists[0].id,
  duration: item.duration_ms,
  explicit: item.explicit,
  id: item.id,
  name: item.name,
  popularity: item.popularity,
  rank: index
}*/

//TODO esnureAuthenticated can be required in instead of passed in
require('./controllers/roomsController')(app, Rooms, Users, ensureAuthenticated, spotifyApi);

app.use(function(req, res) {
  Router.match({ routes: routes, location: req.url }, function(err, redirectLocation, renderProps) {
    if (err) {
      res.status(500).send(err.message)
    } else if (redirectLocation) {
      res.status(302).redirect(redirectLocation.pathname + redirectLocation.search)
    } else if (renderProps) {
      var html = ReactDOM.renderToString(React.createElement(Router.RoutingContext, renderProps));
      var page = swig.renderFile('views/index.html', { html: html });
      res.status(200).send(page);
    } else {
      res.status(404).send('Page Not Found')
    }
  });
});

/**
* Socket.io stuff.
*/
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var onlineUsers = 0;

io.sockets.on('connection', function(socket) {
  onlineUsers++;

  io.sockets.emit('onlineUsers', { onlineUsers: onlineUsers });

  socket.on('disconnect', function() {
    onlineUsers--;
    io.sockets.emit('onlineUsers', { onlineUsers: onlineUsers });
  });
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed. Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.status(401).send();
}

server.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
