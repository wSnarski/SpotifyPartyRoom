var request = require('request');

module.exports = function(app, _auth){
  app.get('/api/me', _auth, function(req, res) {
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
}
