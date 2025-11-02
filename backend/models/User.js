const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['student', 'admin'] },
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }]  // Linking events to users
});

const User = mongoose.model('User', userSchema);

module.exports = User;
