import React, { useMemo } from "react";
import "../App.css";

export default function HomePage({ user, events, setPage }) {
  const isAdmin = user?.role === "admin";

  // --- STUDENT STATS ---
  const { attendedCount, upcomingCount } = useMemo(() => {
    if (!user || isAdmin) return { attendedCount: 0, upcomingCount: 0 };

    const today = new Date();
    const attended = events.filter(
      (ev) =>
        ev.rsvps?.some((id) => id === user.id || id === user._id) &&
        new Date(ev.date) < today
    );
    const upcoming = events.filter(
      (ev) =>
        ev.rsvps?.some((id) => id === user.id || id === user._id) &&
        new Date(ev.date) >= today
    );

    return { attendedCount: attended.length, upcomingCount: upcoming.length };
  }, [events, user, isAdmin]);

  // --- ADMIN STATS ---
  const { totalRSVPs, totalEvents } = useMemo(() => {
    if (!isAdmin) return { totalRSVPs: 0, totalEvents: 0 };

    const totalRSVPs = events.reduce((sum, ev) => sum + (ev.rsvps?.length || 0), 0);
    return { totalRSVPs, totalEvents: events.length };
  }, [events, isAdmin]);

  return (
    <div className="home fade-in">
      {/* ===== HERO SECTION ===== */}
      <div className="hero">
        <h1>
          Welcome back, {user?.name || "User"} {isAdmin ? "🛠️" : "👋"}
        </h1>
        <p>
          {isAdmin
            ? "Manage your created events, track RSVPs, and engage your campus community."
            : "Stay updated on your campus adventures and upcoming events."}
        </p>

        <div className="hero-buttons">
          {isAdmin ? (
            <>
              <button className="btn-primary" onClick={() => setPage("events")}>
                Manage Events
              </button>
              <button className="btn-outline" onClick={() => setPage("explore")}>
                Explore
              </button>
            </>
          ) : (
            <>
              <button className="btn-primary" onClick={() => setPage("events")}>
                View Dashboard
              </button>
              <button className="btn-outline" onClick={() => setPage("explore")}>
                Explore Events
              </button>
            </>
          )}
        </div>
      </div>

      {/* ===== ADMIN VIEW ===== */}
      {isAdmin ? (
        <>
          <div className="section">
            <h2>📊 Admin Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>{totalEvents}</h3>
                <p>Events Created</p>
              </div>
              <div className="stat-card">
                <h3>{totalRSVPs}</h3>
                <p>Total RSVPs</p>
              </div>
              <div className="stat-card">
                <h3>{(totalRSVPs / (totalEvents || 1)).toFixed(1)}</h3>
                <p>Avg RSVPs per Event</p>
              </div>
            </div>
          </div>

          <div className="section">
            <h2>🧠 Quick Actions</h2>
            <div className="event-preview-grid">
              <div className="mini-card" onClick={() => setPage("events")}>
                <h4>+ Create New Event</h4>
                <p>Plan your next activity</p>
              </div>
              <div className="mini-card" onClick={() => setPage("events")}>
                <h4>View RSVP Details</h4>
                <p>Check who joined</p>
              </div>
            </div>
          </div>

          <footer>
            <p>Keep empowering your campus community 🚀</p>
          </footer>
        </>
      ) : (
        <>
          {/* ===== STUDENT VIEW ===== */}
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{attendedCount}</h3>
              <p>Attended</p>
            </div>
            <div className="stat-card">
              <h3>{upcomingCount}</h3>
              <p>Upcoming</p>
            </div>
            <div className="stat-card">
              <h3>{Math.max(0, 3 - attendedCount)}</h3>
              <p>Recommended</p>
            </div>
          </div>

          {/* ===== UPCOMING EVENTS ===== */}
          <div className="section">
            <h2>🎯 Upcoming Events</h2>
            <div className="event-preview-grid">
              {events
                .filter((ev) => new Date(ev.date) >= new Date())
                .slice(0, 3)
                .map((ev) => (
                  <div className="mini-card" key={ev._id}>
                    <h4>{ev.title}</h4>
                    <p>{new Date(ev.date).toLocaleDateString()}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* ===== RECOMMENDATIONS ===== */}
          <div className="section">
            <h2>🔥 Recommended for You</h2>
            <div className="event-preview-grid">
              <div className="mini-card">
                <h4>AI & Society</h4>
                <p>Tomorrow, 3 PM</p>
              </div>
              <div className="mini-card">
                <h4>Campus Design Sprint</h4>
                <p>Nov 18, 2025</p>
              </div>
            </div>
          </div>

          <footer>
            <p>Don’t miss out — over 100 students RSVP’d this week ✨</p>
          </footer>
        </>
      )}
    </div>
  );
}
