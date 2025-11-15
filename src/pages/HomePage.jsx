import React, { useMemo } from "react";
import "../App.css";
import { ArrowRight } from "lucide-react"; 

export default function HomePage({ user, events, setPage }) {
  const isAdmin = user?.role === "admin";

  // --- STUDENT STATS ---
  const { attendedCount, upcomingCount, upcomingEvents } = useMemo(() => {
    if (!user || isAdmin) {
      return { attendedCount: 0, upcomingCount: 0, upcomingEvents: [] };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today

    const attended = [];
    const upcoming = [];

    events.forEach((ev) => {
      // --- [THE FIX] ---
      // This logic is now correct and matches the rest of the app.
      // It checks the populated 'rsvps' array for the user's ID.
      const isEnrolled = ev.rsvps?.some((r) => r._id === user.id);
      // ---------------

      if (!isEnrolled) return; // Skip if not enrolled

      const eventDate = new Date(ev.date);
      eventDate.setHours(0, 0, 0, 0); // Normalize event date

      if (eventDate < today) {
        attended.push(ev);
      } else {
        upcoming.push(ev);
      }
    });

    // Sort upcoming events by date
    const sortedUpcoming = upcoming.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    return {
      attendedCount: attended.length,
      upcomingCount: upcoming.length,
      upcomingEvents: sortedUpcoming.slice(0, 3),
    };
  }, [events, user, isAdmin]);

  // --- ADMIN STATS ---
  const { totalRSVPs, totalEvents } = useMemo(() => {
    if (!isAdmin) return { totalRSVPs: 0, totalEvents: 0 };

    const totalRSVPs = events.reduce(
      (sum, ev) => sum + (ev.rsvps?.length || 0),
      0
    );
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
                View My Events
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
           {/* ... (Admin Quick Actions section - unchanged) ... */}
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
              <h3>{events.length - (attendedCount + upcomingCount)}</h3>
              <p>Events to Explore</p>
            </div>
          </div>

          {/* ===== UPCOMING EVENTS (MODIFIED) ===== */}
          <div className="section">
            <h2>🎯 Your 3 Soonest Upcoming Events</h2>
            {upcomingEvents.length > 0 ? (
              <>
                <div className="event-preview-grid">
                  {upcomingEvents.map((ev) => (
                    <div className="mini-card" key={ev._id}>
                      <h4>{ev.title}</h4>
                      <p>{new Date(ev.date).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
                {/* --- [NEW] View All Button --- */}
                <div className="view-all-btn-container">
                  <button
                    className="btn-outline"
                    onClick={() => setPage("events")}
                  >
                    View All Events <ArrowRight size={16} />
                  </button>
                </div>
              </>
            ) : (
              <p>You haven't RSVP'd to any upcoming events. Go explore!</p>
            )}
          </div>

          <footer>
            <p>Don’t miss out — over 100 students RSVP’d this week ✨</p>
          </footer>
        </>
      )}
    </div>
  );
}