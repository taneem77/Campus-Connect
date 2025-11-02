const express = require('express');
const router = express.Router();
const Event = require('../models/Event');  // Assuming Event model is in models/Event.js
const User = require('../models/User');    // Assuming User model is in models/User.js

// POST /rsvp - RSVP for an event
router.post('/:eventId/rsvp', async (req, res) => {
  try {
    const { userId } = req.body; // Assuming userId is in the request body
    const event = await Event.findById(req.params.eventId); // Find the event by ID
    const user = await User.findById(userId); // Find the user by ID

    if (!event || !user) {
      return res.status(404).json({ message: 'Event or User not found' });
    }

    // Check if user is already RSVP'd to this event
    if (event.rsvps.includes(userId)) {
      return res.status(400).json({ message: 'You have already RSVP\'d to this event' });
    }

    // Add userId to the event's RSVP list
    event.rsvps.push(userId);
    await event.save(); // Save the updated event

    // Optionally, you can also save the event in the user's profile
    user.events.push(event._id);  // Link event to the user's profile
    await user.save(); // Save the updated user

    res.status(200).json({ message: 'RSVP successful!' }); // Send success response
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' }); // Handle any errors
  }
});

// GET /events/:eventId/rsvps - Get all RSVPs for an event
router.get('/:eventId/rsvps', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('rsvps', 'name email'); // Populate rsvps with user data

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Send the list of RSVPs for the event
    res.status(200).json({ rsvps: event.rsvps });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

module.exports = router;
