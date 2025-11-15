import React, { useState, useEffect } from "react";
import {
  Edit,
  Trash2,
  Users,
  ChevronDown,
  ChevronUp,
  MessageSquare, // <-- NEW ICON
} from "lucide-react";
import CommentSection from "./CommentSection"; // <-- NEW IMPORT

export default function EventCard({
  event = {},
  user = {},
  onRSVP,
  onEdit,
  onDelete,
  // --- [NEW] Props for comments ---
  token,
  onCommentPosted,
}) {
  const [showAttendees, setShowAttendees] = useState(false);
  const [showComments, setShowComments] = useState(false); // <-- NEW STATE
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);

  const rsvps = event.rsvps || [];
  const comments = event.comments || []; // <-- NEW
  const isAdmin = user?.role === "admin";
  const currentUserId = user?.id || user?._id || user?.email;

  useEffect(() => {
    const enrolled = rsvps.some(
      (r) =>
        r === currentUserId ||
        r?._id === currentUserId ||
        r?.id === currentUserId ||
        r?.email === user?.email
    );
    setIsEnrolled(enrolled);
  }, [rsvps, user, currentUserId]);

  const handleEnroll = async () => {
    if (loading || isEnrolled) return;
    try {
      setLoading(true);
      await onRSVP(event._id);
      setIsEnrolled(true); // Manually set, as fetch might be slow
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
        <p style={{ color: "var(--muted)", marginBottom: "0.5rem" }}>
          {event.description}
        </p>
        <p className="event-detail">
          📅 <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
        </p>
        <p className="event-detail">
          📍 <strong>Venue:</strong> {event.location || "Not specified"}
        </p>
        {/* --- [NEW] Tags Display --- */}
        {event.tags && event.tags.length > 0 && event.tags[0] !== "" && (
          <div className="event-tags">
            {event.tags.map((tag, i) => (
              <span key={i} className="event-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="event-footer" style={{ marginTop: "1rem" }}>
        <div className="event-stats">
          <div className="stat-item">
            <Users size={18} />
            <span>{rsvps.length || 0} Enrolled</span>
          </div>
          {/* --- [NEW] Comment Count Stat --- */}
          <div className="stat-item">
            <MessageSquare size={18} />
            <span>{comments.length || 0} Comments</span>
          </div>
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
                className="btn-outline btn-danger"
                onClick={() => onDelete(event._id)}
              >
                <Trash2 size={16} /> Delete
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* --- [NEW] Toggle Buttons for Admin/Comments --- */}
      <div className="event-toggle-bar">
        {isAdmin && rsvps.length > 0 && (
          <button className="btn-toggle" onClick={() => setShowAttendees(!showAttendees)}>
            {showAttendees ? "Hide" : "View"} Enrolled
            {showAttendees ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
        <button className="btn-toggle" onClick={() => setShowComments(!showComments)}>
          {showComments ? "Hide" : "Show"} Comments
          {showComments ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      
      {/* --- Attendee Dropdown --- */}
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

      {/* --- [NEW] Comment Section --- */}
      {showComments && (
        <CommentSection
          eventId={event._id}
          comments={comments}
          token={token}
          onCommentPosted={onCommentPosted}
        />
      )}
    </div>
  );
}