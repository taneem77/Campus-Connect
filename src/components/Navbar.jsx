import React from "react";
import { User } from "lucide-react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function Navbar({ user, onLogout, setPage }) {
  const profilePicUrl = user?.profilePicture
    ? `${API_BASE}${user.profilePicture}`
    : null;

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h2 onClick={() => setPage("home")}>Campus Connect</h2>
      </div>

      <div className="navbar-links">
        <button onClick={() => setPage("home")}>Home</button>
        <button onClick={() => setPage("events")}>Events</button>
        <button onClick={() => setPage("explore")}>Explore</button>
        <button onClick={() => setPage("calendar")}>Calendar</button> {/* <-- NEW */}
        <button onClick={() => setPage("profile")}>Profile</button>
      </div>

      <div className="navbar-right">
        <span className="user-info" onClick={() => setPage("profile")}>
          {profilePicUrl ? (
            <img
              src={profilePicUrl}
              alt="Avatar"
              className="navbar-avatar"
            />
          ) : (
            <User size={16} style={{ marginRight: "6px" }} />
          )}
          {user?.name || user?.email}
        </span>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}