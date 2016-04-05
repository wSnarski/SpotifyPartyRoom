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

var client_id = config.spotify_client_id;
var client_secret = config.spotify_client_secret;

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
  clientID:  config.spotify_client_id,
  clientSecret:  config.spotify_client_secret,
  callbackURL: config.spotify_callback_url
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
//TODO use a mongodb session store
app.use(session({ secret: 'keyboard cat' }));
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


//TODO esnureAuthenticated can be required in instead of passed in
require('./controllers/roomsController')(app, Rooms, Users, ensureAuthenticated, spotifyApi);
require('./controllers/tracksController')(app, Users, ensureAuthenticated, spotifyApi);
require('./controllers/usersController')(app, ensureAuthenticated);

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
