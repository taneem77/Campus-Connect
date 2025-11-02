const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  location: { type: String },
  rsvps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]  // User references for RSVP
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
