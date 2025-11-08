const express = require('express');
const Event = require('../models/Event');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// Create event (admin only)
router.post('/create', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, date, location } = req.body;
    if (!title || !date) return res.status(400).json({ message: 'Title and date required' });

    const ev = new Event({
      title,
      description,
      date: new Date(date),
      location,
      createdBy: req.user.id
    });
    await ev.save();
    return res.status(201).json({ message: 'Event created', event: ev });
  } catch (err) {
    console.error('Create event error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get all events (public)
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 }).populate('createdBy', 'name email');
    return res.status(200).json(events);
  } catch (err) {
    console.error('Get events err:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('rsvps', 'name email');
    if (!ev) return res.status(404).json({ message: 'Event not found' });
    return res.status(200).json(ev);
  } catch (err) {
    console.error('Get event err:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update event (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const data = req.body;
    if (data.date) data.date = new Date(data.date);
    const ev = await Event.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!ev) return res.status(404).json({ message: 'Event not found' });
    return res.status(200).json({ message: 'Event updated', event: ev });
  } catch (err) {
    console.error('Update event err:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete event (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const ev = await Event.findByIdAndDelete(req.params.id);
    if (!ev) return res.status(404).json({ message: 'Event not found' });
    return res.status(200).json({ message: 'Event deleted' });
  } catch (err) {
    console.error('Delete event err:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
