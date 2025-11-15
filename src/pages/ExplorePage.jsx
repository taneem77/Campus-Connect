import React, { useState, useEffect, useMemo } from "react";
import { apiRequest } from "../utils/api"; // Assuming api.js is in /utils

export default function ExplorePage({ user, events, token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = user?.role === "admin";

  // Fetch all users if admin
  useEffect(() => {
    if (isAdmin) {
      const fetchUsers = async () => {
        try {
          setLoading(true);
          setError("");
          const data = await apiRequest("/api/users", "GET", null, token);
          setUsers(data.users || []);
        } catch (err) {
          setError(err.message || "Failed to fetch users");
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }
  }, [isAdmin, token]);

  // Memoized stats for students
  const { trendingEvents, upcomingEvents } = useMemo(() => {
    if (isAdmin) return {};

    const sortedByRSVP = [...events].sort(
      (a, b) => (b.rsvps?.length || 0) - (a.rsvps?.length || 0)
    );

    const today = new Date();
    const oneWeekFromNow = new Date(today);
    oneWeekFromNow.setDate(today.getDate() + 7);

    const upcoming = events.filter((ev) => {
      const eventDate = new Date(ev.date);
      return eventDate >= today && eventDate <= oneWeekFromNow;
    });

    return {
      trendingEvents: sortedByRSVP.slice(0, 5), // Top 5 trending
      upcomingEvents: upcoming.slice(0, 5), // Top 5 upcoming this week
    };
  }, [events, isAdmin]);

  return (
    <div className="explore-page fade-in">
      {isAdmin ? (
        /* ================== */
        /* === ADMIN VIEW === */
        /* ================== */
        <div className="admin-explore">
          <h1>🛠️ Admin Explore: User Directory</h1>
          <p>View all registered users in the system.</p>
          {loading && <p>Loading users...</p>}
          {error && <p className="message-error">{error}</p>}
          <div className="user-directory-grid">
            {users.map((u) => (
              <div key={u._id} className="user-card">
                <h4>{u.name || "No Name"}</h4>
                <p>{u.email}</p>
                <span className={`role-badge role-${u.role}`}>{u.role}</span>
                <p>Events RSVP'd: {u.events?.length || 0}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ==================== */
        /* === STUDENT VIEW === */
        /* ==================== */
        <div className="student-explore">
          <h1>🧭 Explore Events</h1>
          <p>Discover what's happening on campus.</p>

          <div className="explore-section">
            <h2>🔥 Trending Events (Top 5)</h2>
            <div className="mini-event-grid">
              {trendingEvents.map((ev) => (
                <div className="mini-card" key={ev._id}>
                  <h4>{ev.title}</h4>
                  <p>{ev.rsvps?.length || 0} students enrolled</p>
                </div>
              ))}
            </div>
          </div>

          <div className="explore-section">
            <h2>🗓️ Happening This Week</h2>
            <div className="mini-event-grid">
              {upcomingEvents.map((ev) => (
                <div className="mini-card" key={ev._id}>
                  <h4>{ev.title}</h4>
                  <p>{new Date(ev.date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}