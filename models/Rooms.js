var mongoose = require('mongoose');

var Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;

//TODO add more info to current and top tracks..
var roomsSchema = new Schema({
  name: String,
  owner: { type: ObjectId, ref: 'Users'},
  subscribers: [{ type: ObjectId, ref: 'Users' }],
  currentTracks: [{
    spotifyId: String,
    name: String,
    artistName: String,
    rating: Number,
    confidence: Number,
  }],
  topTracks: [{
    spotifyId: String,
    name: String,
    artistName: String,
    rating: Number,
    confidence: Number
  }]
});

module.exports = mongoose.model('Rooms', roomsSchema);
