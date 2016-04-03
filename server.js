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
  //callbackURL: 'https://quiet-beyond-64822.herokuapp.com/auth/callback'
  callbackURL: 'http://localhost:4000/auth/callback'
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

app.post('/api/rooms', ensureAuthenticated, function(req, res, next) {
  var Room = new Rooms({
    name: req.body.name,
    owner: req.user.dbId
  }).save(function(err, nRoom){
    if (err) return next(err);
    res.location('/api/rooms/' + nRoom.id.toString());
    res.status(201).send(nRoom);
  });
});

app.get('/api/rooms/:id', function(req, res, next) {
  var id = req.params.id;
  Rooms.findById(id, function(err, room) {
    if (err) return next(err);
    if (!room) {
      return res.status(404).send({ message: 'Room not found.' });
    }
    res.send(room);
  });
});


app.get('/api/me/rooms', ensureAuthenticated, function(req, res, next) {
  Rooms.find({owner: req.user.dbId}, function(err, rooms) {
    if(err) return next(err);
    res.send(rooms);
  });
});

//this endpoint can be used to get
//all the tracks for a user
//or get the spotify top tracks
app.get('/api/me/tracks', ensureAuthenticated, function(req,res,next) {
  console.log(req.query);
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
        if(index < 9 ) {
          rating = 5
        } else if (index < 39) {
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
    function(callback) {
      Users.findById(userId, function(err, user) {
      var tracksToInsert = _.map(req.body, function(track){
        return {
          spotifyId: track.id,
          rating: track.rating
        }
      });
      user.tracks = _.concat(user.tracks, tracksToInsert);
      //user.save(function(err, user) {
        callback(err, user)
      //});
    });
    },
    function(user, callback) {
      //TODO check to make sure we're not exceeding 100 track limit
      var trackIds = _.join(_.map(user.tracks, function(track) { return track.spotifyId} ), ',');
      var trackFeaturesUrl = 'https://api.spotify.com/v1/audio-features/?ids=' + trackIds;
      request.get({
        url: trackFeaturesUrl,
        auth: {
          'bearer': spotifyApi.getAccessToken()
        }
      }, function(err, response, body) {
        //do the track processing here
        console.log(body);
        var tracks = 'b,c,s\n1,2,3\n2,3,4'
        waterfallObj = {
          user: user,
          tracks: tracks
        };
        //console.log(waterfallObj);
        res.send();
        //callback(err, waterfallObj);
      });
    },
    function(waterfallObj, callback) {
      var sourceUrl = 'https://bigml.io/source?username=wsnarski;api_key=1452dd3a9e3255121de7e2c788196d98dc9491c3';
      var sourceOptions = {
        method: 'post',
        body: {"data": waterfallObj.tracks, name:'testInline'},
        json: true,
        url: sourceUrl
      };
      request(sourceOptions, function (err, res, body) {
        waterfallObj.dataSource = body.resource;
        callback(err, waterfallObj);
      });
    },
    function(waterfallObj, callback) {
      var datasetUrl = 'https://bigml.io/dataset?username=wsnarski;api_key=1452dd3a9e3255121de7e2c788196d98dc9491c3';
      var datasetOptions = {
        method: 'post',
        body: {"source": waterfallObj.dataSource, name:'testInline'},
        json: true,
        url: datasetUrl
      }
      request(datasetOptions, function (err, res, body) {
        waterfallObj.dataSet = body.resource;
        callback(err, waterfallObj);
      });
    },
    function(waterfallObj, callback) {
      var modelUrl = 'https://bigml.io/model?username=wsnarski;api_key=1452dd3a9e3255121de7e2c788196d98dc9491c3';
      var modelOptions = {
        method: 'post',
        body: {"dataset": waterfallObj.dataset, name:'testInline'},
        json: true,
        url: modelUrl
      }
      request(modelOptions, function (err, res, body) {
        waterfallObj.model = body.resource
        callback(err, waterfallObj);
      });
    },
    function(waterfallObj, callback) {
        var user = waterfallObj.user;
        var needDel = user.MLsourceUrl;
        if(needDel) {
          delprops = {
            source: user.MLsourceUrl,
            dataset: user.MLdatasetUrl,
            mode: user.MLmodelUrl
          }
        }
        user.MLsourceUrl = waterfallObj.dataSource;
        user.MLdatasetUrl = waterfallObj.dataSet;
        user.MLmodelUrl = waterfallObj.model;
        user.save(function(err, user) {
          if(needDel) {
            waterfallObj.delprops = delprops;
            callback(err, waterfallObj);
          }
          res.send(user);
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

  /*var source = new bigml.Source();
    source.create('./iris.csv', function(error, sourceInfo) {
      if (error) console.log(error);
      if (!error && sourceInfo) {
        var dataset = new bigml.Dataset();
        dataset.create(sourceInfo, function(error, datasetInfo) {
          if (!error && datasetInfo) {
            var model = new bigml.Model();
            model.create(datasetInfo, function (error, modelInfo) {
              if (!error && modelInfo) {
                var prediction = new bigml.Prediction();
                prediction.create(modelInfo, {'petal length': 1})
              }
            });
          }
        });
      }
    });*/
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
//require('./controllers/roomsController')(app, Rooms, ensureAuthenticated);

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
