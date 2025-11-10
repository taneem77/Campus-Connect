import React from "react";

export default function Navbar({ user, onLogout, setPage }) {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h2 onClick={() => setPage("home")}>Campus Connect</h2>
      </div>

      <div className="navbar-links">
        <button onClick={() => setPage("home")}>Home</button>
        <button onClick={() => setPage("events")}>Events</button>
        <button onClick={() => setPage("explore")}>Explore</button>
      </div>

      <div className="navbar-right">
        <span className="user-info">{user?.name || user?.email}</span>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
