module.exports = function(app, Rooms, _auth){
  app.post('/api/rooms', _auth, function(req, res, next) {
    var Room = new Rooms({
      name: req.body.name,
      owner: req.user.dbId,
      subscribers: [req.user.dbId]
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

  app.get('/api/me/rooms', _auth, function(req, res, next) {
    Rooms.find({owner: req.user.dbId}, function(err, rooms) {
      if(err) return next(err);
      res.send(rooms);
    });
  });
}
