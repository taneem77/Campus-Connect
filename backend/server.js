const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const userEventRoutes = require('./routes/userEventRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// connect to mongo
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err.message));

app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/events', userEventRoutes); // rsvp endpoints use same /api/events/:id/...

app.get('/', (req, res) => res.send('Campus Connect Backend Running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
