const express = require('express');
const Event = require('../models/Event');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// RSVP: POST /api/events/:eventId/rsvp
router.post('/:eventId/rsvp', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.eventId;

    const [event, user] = await Promise.all([
      Event.findById(eventId),
      User.findById(userId)
    ]);
    if (!event || !user) return res.status(404).json({ message: 'Event or user not found' });

    if (event.rsvps.includes(userId)) {
      return res.status(400).json({ message: 'Already enrolled' });
    }

    event.rsvps.push(userId);
    user.events.push(eventId);

    await Promise.all([event.save(), user.save()]);
    return res.status(200).json({ message: 'RSVP successful' });
  } catch (err) {
    console.error('RSVP error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get RSVPs for event: GET /api/events/:eventId/rsvps
router.get('/:eventId/rsvps', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('rsvps', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    return res.status(200).json({ rsvps: event.rsvps });
  } catch (err) {
    console.error('Get rsvps err:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
