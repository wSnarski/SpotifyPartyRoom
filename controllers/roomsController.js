module.exports = function(app, Rooms, _auth){
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
}
