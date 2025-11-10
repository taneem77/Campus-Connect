import React, { useState, useEffect } from "react";
import { Edit, Trash2, Users, ChevronDown, ChevronUp } from "lucide-react";

export default function EventCard({ event = {}, user = {}, onRSVP, onEdit, onDelete }) {
  const [showAttendees, setShowAttendees] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);

  const rsvps = event.rsvps || event.rsvp || [];
  const isAdmin = user?.role === "admin";
  const currentUserId = user?._id || user?.id || user?.email;

  useEffect(() => {
    const enrolled = rsvps.some(
      (r) =>
        r === currentUserId ||
        r?._id === currentUserId ||
        r?.id === currentUserId ||
        r?.email === user?.email
    );
    setIsEnrolled(enrolled);
  }, [rsvps, user]);

  const handleEnroll = async () => {
    if (loading || isEnrolled) return;
    try {
      setLoading(true);
      await onRSVP(event._id);
      setIsEnrolled(true);
    } catch (err) {
      console.error("Enroll failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="event-card fade-in">
      <div>
        <h3>{event.title}</h3>
        <p style={{ color: "#cbd5e1", marginBottom: "0.5rem" }}>{event.description}</p>
        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
          📅 <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
        </p>
        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
          📍 <strong>Venue:</strong> {event.venue || "Not specified"}
        </p>
      </div>

      <div className="event-footer" style={{ marginTop: "1rem" }}>
        <div style={{ color: "#22d3ee", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
          <Users size={18} />
          <span>{rsvps.length || 0} Enrolled</span>
        </div>

        <div className="event-actions">
          {!isAdmin && (
            <button
              className="btn-primary"
              onClick={handleEnroll}
              disabled={loading || isEnrolled}
              style={{ minWidth: "110px" }}
            >
              {loading ? "Please wait..." : isEnrolled ? "Enrolled ✓" : "Enroll"}
            </button>
          )}

          {isAdmin && (
            <>
              <button className="btn-outline" onClick={() => onEdit(event)}>
                <Edit size={16} /> Edit
              </button>
              <button
                className="btn-outline"
                style={{ color: "#f87171", borderColor: "#f87171" }}
                onClick={() => onDelete(event._id)}
              >
                <Trash2 size={16} /> Delete
              </button>

              {rsvps.length > 0 && (
                <button className="btn-outline" onClick={() => setShowAttendees(!showAttendees)}>
                  {showAttendees ? (
                    <>
                      Hide Enrolled <ChevronUp size={14} />
                    </>
                  ) : (
                    <>
                      View Enrolled <ChevronDown size={14} />
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {isAdmin && showAttendees && (
        <div className="rsvp-dropdown">
          <strong>Enrolled Students:</strong>
          <ul className="rsvp-list">
            {rsvps.map((r, i) => (
              <li key={i}>{r?.name || r?.email || r?._id || r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
