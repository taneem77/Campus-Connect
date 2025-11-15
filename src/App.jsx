import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, LogIn } from "lucide-react";
import "./App.css";
import "./light-theme.css";
import { Toaster, toast } from "react-hot-toast";

// --- [NEW] Import Calendar CSS ---
import "react-big-calendar/lib/css/react-big-calendar.css";

// Import Components
import Navbar from "./components/Navbar";
import Loader from "./components/Loader";

// Import Pages
import HomePage from "./pages/HomePage";
import EventPage from "./pages/EventPage";
import ExplorePage from "./pages/ExplorePage";
import ProfilePage from "./pages/ProfilePage";
import CalendarPage from "./pages/CalendarPage"; // <-- NEW

// Import API
import { apiRequest } from "./utils/api";

export default function App() {
  // ... (all state variables are the same) ...
  const [tab, setTab] = useState("login");
  const [role, setRole] = useState("student");
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [events, setEvents] = useState([]);
  const [editEvent, setEditEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState("home"); 
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  // ... (all useEffects and handlers are the same) ...
  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
    localStorage.setItem("theme", theme); 
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/api/events", "GET", null, token); 
      setEvents(data.events || []);
    } catch (err) {
      console.error("Error fetching events:", err);
      toast.error(err.message || "Could not fetch events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchEvents();
  }, [user]); 

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Processing...");
    setLoading(true);
    const endpoint = tab === "signup" ? "/api/signup" : "/api/login";
    try {
      const data = await apiRequest(endpoint, "POST", { ...formData, role });
      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        toast.success("Login successful! ✅");
        setPage("home"); 
        setTimeout(() => fetchEvents(), 100);
      }
    } catch (err) {
      setMessage(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken("");
    setEvents([]); 
    setPage("home"); 
    setTab("login"); 
  };
  
  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const handleRSVP = async (id) => {
    try {
      const data = await apiRequest(`/api/events/${id}/rsvp`, "POST", null, token);
      toast.success(data.message); 
      fetchEvents(); 
    } catch (err) {
      toast.error(err.message || "Failed to RSVP"); 
    }
  };

  const handleEventChange = (e) =>
    setEditEvent((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCreateOrEdit = async (e) => {
    e.preventDefault();
    const method = editEvent?._id ? "PUT" : "POST";
    const path = editEvent?._id
      ? `/api/events/${editEvent._id}`
      : "/api/events/create";
    try {
      const data = await apiRequest(path, method, editEvent, token);
      toast.success(data.message); 
      setEditEvent(null); 
      fetchEvents(); 
    } catch (err) {
      toast.error(err.message || "Failed to save event"); 
    }
  };

  const handleDelete = async (id) => {
    toast(
      (t) => (
        <span>
          Delete this event?
          <button
            className="toast-btn-confirm"
            onClick={() => {
              toast.dismiss(t.id);
              deleteEvent(id);
            }}
          >
            Delete
          </button>
          <button
            className="toast-btn-cancel"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
        </span>
      ),
      { icon: "🤔" }
    );
  };
  
  const deleteEvent = async (id) => {
    try {
      await apiRequest(`/api/events/${id}`, "DELETE", null, token);
      toast.success("Event deleted");
      fetchEvents(); 
    } catch (err) {
      toast.error(err.message || "Failed to delete event"); 
    }
  };

  // ---------------- RENDER ----------------
  const renderPage = () => {
    if (loading && events.length === 0 && user) return <Loader />;

    switch (page) {
      case "home":
        return <HomePage user={user} events={events} setPage={setPage} />;
      case "events":
        return (
          <EventPage
            user={user}
            events={events}
            editEvent={editEvent}
            onEventChange={handleEventChange}
            onEventSubmit={handleCreateOrEdit} 
            onRSVP={handleRSVP}
            onEdit={setEditEvent}
            onDelete={handleDelete}
            token={token}
            onCommentPosted={fetchEvents}
          />
        );
      case "explore":
        return <ExplorePage user={user} events={events} token={token} />;
      case "profile":
        return (
          <ProfilePage
            user={user}
            token={token}
            onUserUpdate={handleUserUpdate} 
            theme={theme} 
            toggleTheme={toggleTheme} 
          />
        );
      // --- [NEW] Calendar Page Route ---
      case "calendar":
        return <CalendarPage events={events} />;
      default:
        return <HomePage user={user} events={events} setPage={setPage} />;
    }
  };

  // --- JSX is the same, just adding the Toaster ---
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#333",
            color: "#fff",
          },
        }}
      />
      <AnimatePresence mode="wait">
        {!user ? (
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
                  placeholder={
                    role === "admin" ? "Admin Email" : "Student Email"
                  }
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
          <motion.main
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Navbar user={user} onLogout={handleLogout} setPage={setPage} />
            {renderPage()}
          </motion.main>
        )}
      </AnimatePresence>
    </>
  );
}