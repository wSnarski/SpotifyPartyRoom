require('babel/register');

var express = require('express');
var bodyParser = require('body-parser');
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

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new SpotifyStrategy({
  clientID: 'dcb418aa5f3844a2937a686e11e1f942',
  clientSecret: '1e3b7d5b12184dbd94a6a80e00c8fdfc',
  callbackURL: 'https://desolate-chamber-59755.herokuapp.com/auth/callback'
},
function(accessToken, refreshToken, profile, done) {
  Users.findOrCreate({ spotifyId: profile.id }, function (err, user) {
    return done(err, user);
  });
}
));

mongoose.connect(config.database);

mongoose.connection.on('error', function() {
  console.info('Error: Could not connect to MongoDB. Did you forget to run `mongod`?');
});

var app = express();

app.set('port', process.env.PORT || 3000);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
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
passport.authenticate('spotify', { failureRedirect: '/' }),
function(req, res) {
  res.redirect('/NotHome');
});


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

server.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
