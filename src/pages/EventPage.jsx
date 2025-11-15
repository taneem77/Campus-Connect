import React, { useState, useMemo } from "react";
import EventForm from "../components/EventForm";
import EventCard from "../components/EventCard";
import { Search } from "lucide-react";

export default function EventPage({
  user,
  events,
  editEvent,
  onEventChange,
  onEventSubmit,
  onRSVP,
  onEdit,
  onDelete,
  // --- [NEW] Props for comments ---
  token,
  onCommentPosted,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  // ... (filter logic is the same) ...
  const filteredEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); 
    
    return events.filter((event) => {
      const searchLower = searchTerm.toLowerCase();
      const searchMatch =
        event.title.toLowerCase().includes(searchLower) ||
        event.location.toLowerCase().includes(searchLower) ||
        event.tags?.some((tag) => tag.toLowerCase().includes(searchLower));

      if (!searchMatch) return false;

      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);

      switch (dateFilter) {
        case "today":
          if (eventDate.getTime() !== today.getTime()) return false;
          break;
        case "week":
          if (eventDate < today || eventDate > endOfWeek) return false;
          break;
        case "month":
          if (eventDate < today || eventDate > endOfMonth) return false;
          break;
        case "all":
        default:
          break;
      }
      return true;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [events, searchTerm, dateFilter]);


  return (
    <>
      {user.role === "admin" && (
        <EventForm
          editEvent={editEvent}
          onChange={onEventChange}
          onSubmit={onEventSubmit}
        />
      )}

      <div className="filter-container fade-in">
        {/* ... (search/filter bar is the same) ... */}
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search by title, location, or tag (e.g., 'hackathon')"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={dateFilter === "all" ? "active" : ""}
            onClick={() => setDateFilter("all")}
          >
            All
          </button>
          <button
            className={dateFilter === "today" ? "active" : ""}
            onClick={() => setDateFilter("today")}
          >
            Today
          </button>
          <button
            className={dateFilter === "week" ? "active" : ""}
            onClick={() => setDateFilter("week")}
          >
            This Week
          </button>
          <button
            className={dateFilter === "month" ? "active" : ""}
            onClick={() => setDateFilter("month")}
          >
            This Month
          </button>
        </div>
      </div>

      <div className="event-grid fade-in" style={{ marginTop: "2rem" }}>
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCard
              key={event._id}
              event={event}
              user={user}
              onRSVP={onRSVP}
              onEdit={onEdit}
              onDelete={onDelete}
              // --- [NEW] Pass props down ---
              token={token}
              onCommentPosted={onCommentPosted}
              // ----------------------------
            />
          ))
        ) : (
          <p>No events found matching your criteria.</p>
        )}
      </div>
    </>
  );
}