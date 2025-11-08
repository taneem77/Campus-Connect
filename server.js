// ===== PAVI'S FULL BACKEND (server.js) =====

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

// --- Admin Create Event ---
app.post('/api/events/create', async (req, res) => {
  try {
    const { title, description, date, location } = req.body;
    const event = new Event({ title, description, date, location });
    await event.save();
    res.status(201).json({ message: 'Event created successfully', event });
  } catch (err) {
    res.status(500).json({ message: 'Error creating event', error: err.message });
  }
});

// --- Get All Events ---
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching events', error: err.message });
  }
});

// --- Edit Event ---
app.put('/api/events/:id', async (req, res) => {
  try {
    const { title, description, date, location } = req.body;
    const updated = await Event.findByIdAndUpdate(
      req.params.id,
      { title, description, date, location },
      { new: true }
    );
    res.status(200).json({ message: 'Event updated', event: updated });
  } catch (err) {
    res.status(500).json({ message: 'Error updating event', error: err.message });
  }
});

// --- Delete Event ---
app.delete('/api/events/:id', async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting event', error: err.message });
  }
});

// Root test
app.get('/', (req, res) => {
  res.send('Pavi Backend - Event Management Running');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Pavi Backend running on port ${PORT}`));
