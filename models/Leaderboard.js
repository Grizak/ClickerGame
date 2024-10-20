const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  playerName: { type: String, required: true },
  score: { type: Number, required: true }
});

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);
module.exports = Leaderboard;
