import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  LogIn,
  CalendarDays,
  Star,
  Compass,
} from "lucide-react";
import "./App.css";

import Navbar from "./components/Navbar";
import EventCard from "./components/EventCard";
import EventForm from "./components/EventForm";
import Loader from "./components/Loader";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function App() {
  const [tab, setTab] = useState("login");
  const [role, setRole] = useState("student");
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [events, setEvents] = useState([]);
  const [editEvent, setEditEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState("home");
  const eventsRef = useRef(null);

  // ---------------- AUTO LOGIN ----------------
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  // ---------------- FETCH EVENTS ----------------
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/events`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchEvents();
  }, [user]);

  // ---------------- FORM HANDLERS ----------------
  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Processing...");
    setLoading(true);
    const endpoint = tab === "signup" ? "/api/signup" : "/api/login";

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Error");
        setLoading(false);
        return;
      }

      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setMessage("Login successful ✅ Redirecting...");
        setTimeout(() => fetchEvents(), 600);
      }
    } catch {
      setMessage("⚠️ Network error");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- LOGOUT ----------------
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken("");
    setTab("login");
  };

  // ---------------- STUDENT RSVP ----------------
  const handleRSVP = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/events/${id}/rsvp`, {
        method: "POST",
        headers: { "x-auth-token": token },
      });
      const data = await res.json();
      alert(data.message);
      fetchEvents();
    } catch {
      alert("Failed to RSVP");
    }
  };

  // ---------------- ADMIN EVENT HANDLERS ----------------
  const handleEventChange = (e) =>
    setEditEvent((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCreateOrEdit = async (e) => {
    e.preventDefault();
    const method = editEvent?._id ? "PUT" : "POST";
    const url = editEvent?._id
      ? `${API_BASE}/api/events/${editEvent._id}`
      : `${API_BASE}/api/events/create`;

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": token,
      },
      body: JSON.stringify(editEvent),
    });

    const data = await res.json();
    alert(data.message);
    setEditEvent(null);
    fetchEvents();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    await fetch(`${API_BASE}/api/events/${id}`, {
      method: "DELETE",
      headers: { "x-auth-token": token },
    });
    fetchEvents();
  };

  const scrollToEvents = () => {
    if (eventsRef.current) {
      eventsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // ---------------- RENDER ----------------
  return (
    <AnimatePresence mode="wait">
      {!user ? (
        // ---------- LOGIN / SIGNUP PAGE ----------
        <motion.main
          key="auth"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div className="card" layout>
            <h3>Authentication</h3>

            <div className="auth-tabs">
              <button
                onClick={() => setTab("login")}
                className={tab === "login" ? "active" : ""}
              >
                <LogIn size={16} /> Login
              </button>
              <button
                onClick={() => setTab("signup")}
                className={tab === "signup" ? "active" : ""}
              >
                <UserPlus size={16} /> Signup
              </button>
            </div>

            <div className="auth-tabs" style={{ marginBottom: "1.5rem" }}>
              <button
                onClick={() => setRole("student")}
                className={role === "student" ? "active" : ""}
              >
                Student
              </button>
              <button
                onClick={() => setRole("admin")}
                className={role === "admin" ? "active" : ""}
              >
                Admin
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {tab === "signup" && (
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              )}
              <input
                type="email"
                name="email"
                placeholder={role === "admin" ? "Admin Email" : "Student Email"}
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : tab === "login"
                  ? `Login as ${role}`
                  : `Sign Up as ${role}`}
              </button>
              {message && <p className="message">{message}</p>}
            </form>
          </motion.div>
        </motion.main>
      ) : (
        // ---------- DASHBOARD ----------
        <motion.main
          key="dashboard"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.5 }}
        >
          <Navbar user={user} onLogout={handleLogout} setPage={setPage} />

          {page === "home" && (
            <>
              {/* ===== BIG SUMMARY CARD ===== */}
              <motion.div
                className="summary-card fade-in"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {user.role === "admin" ? (
                  <>
                    <h2>📊 Admin Dashboard</h2>
                    <p>Track event activity and campus engagement below.</p>
                    <div className="summary-stats">
                      <div>
                        <h3>{events.length}</h3>
                        <p>Events Created</p>
                      </div>
                      <div>
                        <h3>
                          {events.reduce((sum, e) => sum + (e.rsvps?.length || 0), 0)}
                        </h3>
                        <p>Total Attendees</p>
                      </div>
                      <div>
                        <h3>
                          {events.length > 0
                            ? events.sort(
                                (a, b) => (b.rsvps?.length || 0) - (a.rsvps?.length || 0)
                              )[0].title
                            : "—"}
                        </h3>
                        <p>Top Event</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h2>🎓 Student Dashboard</h2>
                    <p>Your participation summary across campus events.</p>
                    <div className="summary-stats">
                      <div>
                        <h3>
                          {
                            events.filter((e) =>
                              e.rsvps?.some(
                                (r) =>
                                  r === user._id ||
                                  r?._id === user._id ||
                                  r?.email === user.email
                              )
                            ).length
                          }
                        </h3>
                        <p>Enrolled Events</p>
                      </div>
                      <div>
                        <h3>{events.filter((e) => new Date(e.date) < new Date()).length}</h3>
                        <p>Attended Events</p>
                      </div>
                      <div>
                        <h3>{events.filter((e) => new Date(e.date) >= new Date()).length}</h3>
                        <p>Upcoming Events</p>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>

              {/* ===== RECENT EVENTS ===== */}
              <div className="recent-events fade-in">
                <h2>Recent Events</h2>
                <div className="event-grid">
                  {[...events]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 3)
                    .map((event) => (
                      <EventCard
                        key={event._id}
                        event={event}
                        user={user}
                        onRSVP={handleRSVP}
                        onEdit={setEditEvent}
                        onDelete={handleDelete}
                      />
                    ))}
                </div>

                <div style={{ textAlign: "center", marginTop: "2rem" }}>
                  <button className="btn-primary" onClick={() => setPage("events")}>
                    View All Events
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ===== EVENTS PAGE ===== */}
          {page === "events" && (
            <>
              {user.role === "admin" && (
                <EventForm
                  editEvent={editEvent}
                  onChange={handleEventChange}
                  onSubmit={handleCreateOrEdit}
                />
              )}
              <div className="event-grid fade-in" style={{ marginTop: "2rem" }}>
                {events.map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    user={user}
                    onRSVP={handleRSVP}
                    onEdit={setEditEvent}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </>
          )}
        </motion.main>
      )}
    </AnimatePresence>
  );
}
