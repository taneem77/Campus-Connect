// server.js
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

// -- Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// -- Helpful mongoose options & connect
mongoose.set("strictQuery", true);

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/campus-connect";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log(`✅ MongoDB connected to ${MONGO_URI}`))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ===== SCHEMAS =====
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: function () { return this.role === "student" || this.role === "admin"; } },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "admin"], required: true },
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  },
  { timestamps: true }
);
const User = mongoose.model("User", UserSchema);

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    date: Date,
    location: String,
    rsvps: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);
const Event = mongoose.model("Event", EventSchema);

// ===== HELPERS =====
const safeJson = (res, status, payload) => res.status(status).json(payload);

// ===== AUTH =====

// Signup
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // basic validation
    if (!email || !password || !role) {
      return safeJson(res, 400, { message: "Missing required fields: email, password, role" });
    }
    if (!["student", "admin"].includes(role)) {
      return safeJson(res, 400, { message: "Invalid role. Must be 'student' or 'admin'." });
    }

    const existing = await User.findOne({ email }).exec();
    if (existing) {
      return safeJson(res, 409, { message: "User already exists with that email" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ name: name || "", email, password: hashed, role });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET || "devsecret", {
      expiresIn: "1d",
    });

    return safeJson(res, 201, {
      message: "Signup successful",
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
    });
  } catch (err) {
    console.error("Signup error:", err);
    // Duplicate key handling (unique email)
    if (err.code === 11000) {
      return safeJson(res, 409, { message: "Email already exists" });
    }
    return safeJson(res, 500, { message: "Signup failed", error: err.message });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) return safeJson(res, 400, { message: "Missing email/password/role" });

    const user = await User.findOne({ email, role }).exec();
    if (!user) return safeJson(res, 401, { message: "Invalid credentials (email/role mismatch)" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return safeJson(res, 401, { message: "Invalid credentials (wrong password)" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "devsecret", {
      expiresIn: "1d",
    });

    return safeJson(res, 200, {
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    return safeJson(res, 500, { message: "Login failed", error: err.message });
  }
});

// ===== AUTH MIDDLEWARE =====
function auth(req, res, next) {
  const token = req.header("x-auth-token") || req.header("authorization")?.replace("Bearer ", "");
  if (!token) return safeJson(res, 401, { message: "No token provided" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return safeJson(res, 401, { message: "Invalid token" });
  }
}

// ===== EVENTS =====

// Admin: Create Event
app.post("/api/events/create", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return safeJson(res, 403, { message: "Only admins can create events" });

    const { title, description, date, location } = req.body;
    if (!title) return safeJson(res, 400, { message: "Event title required" });

    const event = new Event({ title, description, date, location });
    await event.save();
    return safeJson(res, 201, { message: "Event created", event });
  } catch (err) {
    console.error("Create event error:", err);
    return safeJson(res, 500, { message: "Create event failed", error: err.message });
  }
});

// Admin: Edit Event
app.put("/api/events/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return safeJson(res, 403, { message: "Only admins can edit events" });
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true }).exec();
    if (!updated) return safeJson(res, 404, { message: "Event not found" });
    return safeJson(res, 200, { message: "Event updated", event: updated });
  } catch (err) {
    console.error("Update event error:", err);
    return safeJson(res, 500, { message: "Update failed", error: err.message });
  }
});

// Admin: Delete Event
app.delete("/api/events/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return safeJson(res, 403, { message: "Only admins can delete events" });
    await Event.findByIdAndDelete(req.params.id).exec();
    return safeJson(res, 200, { message: "Event deleted" });
  } catch (err) {
    console.error("Delete event error:", err);
    return safeJson(res, 500, { message: "Delete failed", error: err.message });
  }
});

// All: Get events
// All: Get events (with RSVP user info)
app.get("/api/events", async (req, res) => {
  try {
    // Populate RSVPs with user name & email
    const events = await Event.find()
      .populate("rsvps", "name email role") // 👈 fetch these fields from User
      .lean()
      .exec();

    return safeJson(res, 200, { events });
  } catch (err) {
    console.error("Get events error:", err);
    return safeJson(res, 500, {
      message: "Could not fetch events",
      error: err.message,
    });
  }
});

// Student: RSVP
app.post("/api/events/:id/rsvp", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") return safeJson(res, 403, { message: "Only students can RSVP" });

    const event = await Event.findById(req.params.id).exec();
    if (!event) return safeJson(res, 404, { message: "Event not found" });

    if (event.rsvps.some((id) => id.toString() === req.user.id)) {
      return safeJson(res, 400, { message: "Already RSVP’d" });
    }

    event.rsvps.push(req.user.id);
    await event.save();
    return safeJson(res, 200, { message: "RSVP successful", event });
  } catch (err) {
    console.error("RSVP error:", err);
    return safeJson(res, 500, { message: "RSVP failed", error: err.message });
  }
});

// ===== ROOT =====
app.get("/", (req, res) => res.send("🚀 CampusConnect API Running"));

// ===== START =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
