var mongoose = require('mongoose');

var Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;

var roomsSchema = new Schema({
  name: String,
  owner: { type: ObjectId, ref: 'Users'},
  subscribers: [{ type: ObjectId, ref: 'Users' }],
  currentTracks: [{
    spotifyId: String,
    ratings: [{
      spotifyUser: String,
      rating: Number
    }]
  }],
  topTracks: [{
    spotifyId: String
  }]
});

module.exports = mongoose.model('Rooms', roomsSchema);
