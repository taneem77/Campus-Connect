const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');
const userEventRoutes = require('./routes/userEventRoutes');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware to parse JSON
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

// Routes
app.use('/api/users', userRoutes);        // User-related routes
app.use('/api/events', userEventRoutes);  // Event RSVP routes

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
