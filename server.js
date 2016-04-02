require('babel/register');

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
var SpotifyStrategy = require('passport-spotify').Strategy;
var config = require('./config');
var Users = require('./models/Users');
var Rooms = require('./models/Rooms');
var session = require('express-session');
var request = require('request');

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
  //callbackURL: 'http://localhost:4000/auth/callback'
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
passport.authenticate('spotify', {scope: ['user-read-email', 'user-read-private'], showDialog: true}),
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
passport.authenticate('spotify', { failureRedirect: '/Login' }),
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

app.post('/api/rooms', _auth, function(req, res, next) {
  var Room = new Rooms({
    name: req.body.name,
    owner: req.user.dbId
  }).save(function(err, nRoom){
    if (err) return next(err);
    res.location('/api/rooms/' + nRoom.id.toString());
    res.status(201).send(nRoom);
  });
});

app.get('/api/me/rooms', ensureAuthenticated, function(req, res, next) {

});


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
