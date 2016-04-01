var mongoose = require('mongoose');

var usersSchema = new mongoose.Schema({
  spotifyId: String
});

module.exports = mongoose.model('Users', usersSchema);
