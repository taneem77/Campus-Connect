// ===== TEDLA'S FULL BACKEND (server.js) =====

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ===== MONGODB CONNECTION =====
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ====== MODELS ======
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['student', 'admin'] },
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }]
});
const User = mongoose.model('User', userSchema);

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  location: { type: String },
  rsvps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});
const Event = mongoose.model('Event', eventSchema);

// ====== ROUTES ======

// --- User Signup ---
app.post('/api/users/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const newUser = new User({ name, email, password, role });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
});

// --- RSVP to Event ---
app.post('/api/events/:eventId/rsvp', async (req, res) => {
  try {
    const { userId } = req.body;
    const event = await Event.findById(req.params.eventId);
    const user = await User.findById(userId);

    if (!event || !user) return res.status(404).json({ message: 'Event or User not found' });

    if (event.rsvps.includes(userId)) {
      return res.status(400).json({ message: 'Already RSVP’d to this event' });
    }

    event.rsvps.push(userId);
    user.events.push(event._id);

    await event.save();
    await user.save();

    res.status(200).json({ message: 'RSVP successful' });
  } catch (err) {
    res.status(500).json({ message: 'RSVP failed', error: err.message });
  }
});

// --- Get RSVPs for an Event ---
app.get('/api/events/:eventId/rsvps', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('rsvps', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json({ rsvps: event.rsvps });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching RSVPs', error: err.message });
  }
});

// Root test
app.get('/', (req, res) => {
  res.send('Tedla Backend - RSVP Running');
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`🚀 Tedla Backend running on port ${PORT}`));
