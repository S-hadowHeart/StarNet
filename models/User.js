const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  profilePicture: {
    type: String,
    default: '/images/default-avatar.png'
  },
  bio: {
    type: String,
    default: ''
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  resetKey: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

userSchema.plugin(passportLocalMongoose); // Adds username, hash, salt & auth methods

module.exports = mongoose.model('User', userSchema);
