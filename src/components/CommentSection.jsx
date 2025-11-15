import React, { useState } from "react";
import { apiRequest } from "../utils/api";
import { toast } from "react-hot-toast";
import { User, Send } from "lucide-react";

// Get API_BASE for profile picture URLs
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function CommentSection({ eventId, comments = [], token, onCommentPosted }) {
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await apiRequest(
        `/api/events/${eventId}/comment`,
        "POST",
        { text: newComment },
        token
      );
      toast.success("Comment posted!");
      setNewComment("");
      onCommentPosted(); // This tells App.jsx to re-fetch events
    } catch (err) {
      toast.error(err.message || "Failed to post comment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="comment-section">
      <h4>Q/A & Discussion ({comments.length})</h4>
      
      {/* --- Comment Input Form --- */}
      <form onSubmit={handleSubmit} className="comment-form">
        <input
          type="text"
          placeholder="Ask a question or add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          <Send size={16} />
        </button>
      </form>

      {/* --- Comment List --- */}
      <div className="comment-list">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem key={comment._id} comment={comment} />
          ))
        ) : (
          <p className="no-comments">Be the first to comment!</p>
        )}
      </div>
    </div>
  );
}

// --- Single Comment Item Component ---
function CommentItem({ comment }) {
  const { author, text, createdAt } = comment;
  const isAdmin = author?.role === "admin";
  const profilePicUrl = author?.profilePicture
    ? `${API_BASE}${author.profilePicture}`
    : null;

  return (
    <div className="comment-item">
      <div className="comment-avatar">
        {profilePicUrl ? (
          <img src={profilePicUrl} alt={author?.name} />
        ) : (
          <User size={18} />
        )}
      </div>
      <div className="comment-content">
        <div className="comment-header">
          <span className="comment-author">{author?.name || "User"}</span>
          {isAdmin && <span className="admin-badge">Admin</span>}
          <span className="comment-date">
            {new Date(createdAt).toLocaleString()}
          </span>
        </div>
        <p className="comment-text">{text}</p>
      </div>
    </div>
  );
}