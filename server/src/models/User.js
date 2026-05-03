const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true, // allows nulls but keeps uniqueness
  },
  password: {
    type: String,
    required: false, 
  },
  phone: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  name: {
    type: String,
    required: true,
    default: 'User'
  },
  profilePic: {
    type: String,
    default: ''
  },
  googleId: String,
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
