const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // If using authentication
    points: { type: Number, default: 0 }, // Score for the clicker game
    upgrades: {
        autoClicker: { type: Number, default: 0 },
        doubleClick: { type: Number, default: 0 }
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
