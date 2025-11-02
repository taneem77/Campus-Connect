const express = require('express');
const User = require('../models/User');  // Correct import path
const router = express.Router();

// POST: Sign up a new user (Student or Club Admin)
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const newUser = new User({ name, email, password, role });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
});

module.exports = router;
