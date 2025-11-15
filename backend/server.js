import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose.set("strictQuery", true);

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/campus-connect";
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
    name: {
      type: String,
      required: function () {
        return this.role === "student" || this.role === "admin";
      },
    },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "admin"], required: true },
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    profilePicture: { type: String, default: "" },
  },
  { timestamps: true }
);
const User = mongoose.model("User", UserSchema);

// --- [NEW] COMMENT SCHEMA ---
const CommentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    // Link to the user who wrote the comment
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Link to the event this comment belongs to
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  },
  { timestamps: true } // Adds createdAt and updatedAt
);
const Comment = mongoose.model("Comment", CommentSchema);
// --------------------------

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    date: Date,
    location: String,
    rsvps: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: String }],
    // --- [NEW] Link to comments ---
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  },
  { timestamps: true }
);
const Event = mongoose.model("Event", EventSchema);

// ===== HELPERS =====
const safeJson = (res, status, payload) => res.status(status).json(payload);

const createUserData = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profilePicture: user.profilePicture,
});

// ... (Auth routes are all the same) ...
// ===== AUTH =====
// Signup
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password || !role) {
      return safeJson(res, 400, {
        message: "Missing required fields: email, password, role",
      });
    }
    if (!["student", "admin"].includes(role)) {
      return safeJson(res, 400, {
        message: "Invalid role. Must be 'student' or 'admin'.",
      });
    }
    const existing = await User.findOne({ email }).exec();
    if (existing) {
      return safeJson(res, 409, {
        message: "User already exists with that email",
      });
    }
    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ name: name || "", email, password: hashed, role });
    await newUser.save();
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: "1d" }
    );
    return safeJson(res, 201, {
      message: "Signup successful",
      token,
      user: createUserData(newUser),
    });
  } catch (err) {
    console.error("Signup error:", err);
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
    if (!email || !password || !role)
      return safeJson(res, 400, { message: "Missing email/password/role" });
    const user = await User.findOne({ email, role }).exec();
    if (!user)
      return safeJson(res, 401, {
        message: "Invalid credentials (email/role mismatch)",
      });
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return safeJson(res, 401, {
        message: "Invalid credentials (wrong password)",
      });
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: "1d" }
    );
    return safeJson(res, 200, {
      message: "Login successful",
      token,
      user: createUserData(user),
    });
  } catch (err) {
    console.error("Login error:", err);
    return safeJson(res, 500, { message: "Login failed", error: err.message });
  }
});
// ===== AUTH MIDDLEWARE =====
function auth(req, res, next) {
  const token =
    req.header("x-auth-token") ||
    req.header("authorization")?.replace("Bearer ", "");
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
// ... (Create, Edit, Delete are the same) ...
// Admin: Create Event
app.post("/api/events/create", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return safeJson(res, 403, { message: "Only admins can create events" });

    const { title, description, date, location, tags } = req.body;
    if (!title)
      return safeJson(res, 400, { message: "Event title required" });

    const event = new Event({ title, description, date, location, tags });
    await event.save();
    return safeJson(res, 201, { message: "Event created", event });
  } catch (err) {
    console.error("Create event error:", err);
    return safeJson(res, 500, {
      message: "Create event failed",
      error: err.message,
    });
  }
});
// Admin: Edit Event
app.put("/api/events/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return safeJson(res, 403, { message: "Only admins can edit events" });
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).exec();
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
    if (req.user.role !== "admin")
      return safeJson(res, 403, { message: "Only admins can delete events" });
    await Event.findByIdAndDelete(req.params.id).exec();
    return safeJson(res, 200, { message: "Event deleted" });
  } catch (err) {
    console.error("Delete event error:", err);
    return safeJson(res, 500, { message: "Delete failed", error: err.message });
  }
});

// --- [UPDATED] Get events (with comments) ---
app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find()
      .populate("rsvps", "name email role") // Populates who RSVP'd
      .populate({
        path: "comments", // Populate comments array
        populate: {
          path: "author", // In each comment, populate the author
          select: "name role profilePicture", // Only get these fields
        },
        options: { sort: { 'createdAt': -1 } } // Sort comments newest first
      })
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
// ---------------------------------------------

// Student: RSVP
app.post("/api/events/:id/rsvp", auth, async (req, res) => {
  try {
    if (req.user.role !== "student")
      return safeJson(res, 403, { message: "Only students can RSVP" });

    const event = await Event.findById(req.params.id).exec();
    if (!event) return safeJson(res, 404, { message: "Event not found" });
    
    const user = await User.findById(req.user.id).exec();
    if (!user) return safeJson(res, 404, { message: "User not found" });

    if (event.rsvps.some((id) => id.toString() === req.user.id)) {
      return safeJson(res, 400, { message: "Already RSVP’d" });
    }

    event.rsvps.push(req.user.id);
    user.events.push(event._id); 

    await event.save();
    await user.save(); 
    
    return safeJson(res, 200, { message: "RSVP successful", event });
  } catch (err) { 
    console.error("RSVP error:", err);
    return safeJson(res, 500, { message: "RSVP failed", error: err.message });
  }
});

// --- [NEW] Post a Comment ---
app.post("/api/events/:id/comment", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return safeJson(res, 400, { message: "Comment text is required" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return safeJson(res, 404, { message: "Event not found" });
    }

    // Create the new comment
    const comment = new Comment({
      text,
      author: req.user.id, // from auth middleware
      event: event._id,
    });
    await comment.save();

    // Add comment's ID to the event's comments array
    event.comments.push(comment._id);
    await event.save();
    
    // We need to send back the populated comment
    const populatedComment = await Comment.findById(comment._id)
      .populate("author", "name role profilePicture")
      .exec();

    return safeJson(res, 201, { message: "Comment posted", comment: populatedComment });
  } catch (err) {
    console.error("Comment post error:", err);
    return safeJson(res, 500, { message: "Failed to post comment" });
  }
});
// ------------------------------

// ... (User/Profile routes are all the same) ...
// ===== USERS / PROFILE =====
// [Admin] Get all users
app.get("/api/users", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return safeJson(res, 403, { message: "Access denied" });
  }
  try {
    const users = await User.find({ role: "student" }) 
      .select("-password")
      .populate("events")
      .lean();
    return safeJson(res, 200, { users });
  } catch (err) {
    console.error("Get users error:", err);
    return safeJson(res, 500, { message: "Failed to fetch users" });
  }
});
// [User] Update own name
app.put("/api/profile/name", auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return safeJson(res, 400, { message: "Name is required" });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name },
      { new: true }
    ).select("-password");
    if (!user) {
      return safeJson(res, 404, { message: "User not found" });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: "1d" }
    );
    return safeJson(res, 200, {
      message: "Name updated successfully",
      token,
      user: createUserData(user),
    });
  } catch (err) {
    console.error("Update name error:", err);
    return safeJson(res, 500, { message: "Failed to update name" });
  }
});
// [User] Update own password
app.put("/api/profile/password", auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return safeJson(res, 400, { message: "Old and new password required" });
    }
    const user = await User.findById(req.user.id).exec();
    if (!user) {
      return safeJson(res, 404, { message: "User not found" });
    }
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return safeJson(res, 401, { message: "Incorrect old password" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return safeJson(res, 200, { message: "Password updated successfully" });
  } catch (err) {
    console.error("Update password error:", err);
    return safeJson(res, 500, { message: "Failed to update password" });
  }
});
// Multer config
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    cb(
      null,
      `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});
const upload = multer({ storage });
// Update profile picture
app.post(
  "/api/profile/picture",
  auth,
  upload.single("profilePic"),
  async (req, res) => {
    try {
      if (!req.file) {
        return safeJson(res, 400, { message: "No file uploaded" });
      }
      const user = await User.findById(req.user.id);
      if (!user) {
        return safeJson(res, 404, { message: "User not found" });
      }
      user.profilePicture = `/uploads/${req.file.filename}`;
      await user.save();
      return safeJson(res, 200, {
        message: "Profile picture updated",
        user: createUserData(user),
      });
    } catch (err) {
      console.error("Pic upload error:", err);
      return safeJson(res, 500, { message: "Failed to upload picture" });
    }
  }
);

// ===== ROOT =====
app.get("/", (req, res) => res.send("🚀 CampusConnect API Running"));

// ===== START =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));