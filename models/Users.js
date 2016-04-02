var mongoose = require('mongoose');

var usersSchema = new mongoose.Schema({
  spotifyId: String,
  MLsourceUrl: String,
  MLdatasetUrl: String,
  MLmodelUrl: String,
  MLpredictionsURLs: [String],
  tracks: [{
    spotifyId: String,
    rating: Number
  }]
});

module.exports = mongoose.model('Users', usersSchema);
