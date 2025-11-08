// ===== Unified Backend: Auth + Events + RSVP =====

import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ====== MongoDB Connection ======
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ MongoDB Error:", err));

// ====== MODELS ======

// -- Auth Users (simple email-password login) --
const AuthUserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String
});
const AuthUser = mongoose.model("AuthUser", AuthUserSchema);

// -- Campus Users (Pavi + Tedla’s models) --
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ["student", "admin"] },
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }]
});
const User = mongoose.model("User", UserSchema);

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  location: String,
  rsvps: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});
const Event = mongoose.model("Event", EventSchema);

// =========================================
// ===== AUTHENTICATION ROUTES (Login/Register)
// =========================================

// Register (email + password)
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await AuthUser.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    user = new AuthUser({ email, password: hashed });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ msg: "User registered", token });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Login (email + password)
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await AuthUser.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ msg: "Login successful", token });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Auth middleware
function auth(req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ msg: "No token, auth denied" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch {
    res.status(401).json({ msg: "Token invalid" });
  }
}

// Protected route
app.get("/api/user", auth, async (req, res) => {
  const user = await AuthUser.findById(req.user).select("-password");
  res.json(user);
});

// =========================================
// ===== USER MANAGEMENT (Pavi + Tedla)
// =========================================

// User Signup (with role)
app.post("/api/users/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ message: "All fields required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const newUser = new User({ name, email, password, role });
    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
});

// =========================================
// ===== EVENT MANAGEMENT (Pavi)
// =========================================

// Admin Create Event
app.post("/api/events/create", async (req, res) => {
  try {
    const { title, description, date, location } = req.body;
    const event = new Event({ title, description, date, location });
    await event.save();
    res.status(201).json({ message: "Event created successfully", event });
  } catch (err) {
    res.status(500).json({ message: "Error creating event", error: err.message });
  }
});

// Get All Events
app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: "Error fetching events", error: err.message });
  }
});

// Edit Event
app.put("/api/events/:id", async (req, res) => {
  try {
    const { title, description, date, location } = req.body;
    const updated = await Event.findByIdAndUpdate(
      req.params.id,
      { title, description, date, location },
      { new: true }
    );
    res.status(200).json({ message: "Event updated", event: updated });
  } catch (err) {
    res.status(500).json({ message: "Error updating event", error: err.message });
  }
});

// Delete Event
app.delete("/api/events/:id", async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting event", error: err.message });
  }
});

// =========================================
// ===== RSVP SYSTEM (Tedla)
// =========================================

// RSVP to an Event
app.post("/api/events/:eventId/rsvp", async (req, res) => {
  try {
    const { userId } = req.body;
    const event = await Event.findById(req.params.eventId);
    const user = await User.findById(userId);

    if (!event || !user)
      return res.status(404).json({ message: "Event or User not found" });

    if (event.rsvps.includes(userId))
      return res.status(400).json({ message: "Already RSVP’d to this event" });

    event.rsvps.push(userId);
    user.events.push(event._id);

    await event.save();
    await user.save();

    res.status(200).json({ message: "RSVP successful" });
  } catch (err) {
    res.status(500).json({ message: "RSVP failed", error: err.message });
  }
});

// Get RSVPs for an Event
app.get("/api/events/:eventId/rsvps", async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).populate("rsvps", "name email");
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.status(200).json({ rsvps: event.rsvps });
  } catch (err) {
    res.status(500).json({ message: "Error fetching RSVPs", error: err.message });
  }
});

// =========================================
// ===== ROOT TEST
// =========================================
app.get("/", (req, res) => {
  res.send("🚀 Unified Backend Running: Auth + Events + RSVP");
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
