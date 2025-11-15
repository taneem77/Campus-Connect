import React from "react";
import { CalendarPlus, Edit } from "lucide-react";

export default function EventForm({ editEvent, onChange, onSubmit }) {
  // --- NEW: Handle tags as a string ---
  const handleTagsChange = (e) => {
    // Convert comma-separated string to an array
    const tagsArray = e.target.value.split(",").map((tag) => tag.trim());
    // Create a new event object for the onChange prop
    onChange({
      target: {
        name: "tags",
        value: tagsArray,
      },
    });
  };

  // Convert array back to string for the input
  const tagsString = editEvent?.tags?.join(", ") || "";

  return (
    <div className="event-form fade-in">
      <h2 className="form-title">
        {editEvent?._id ? (
          <>
            <Edit size={22} /> Edit Event
          </>
        ) : (
          <>
            <CalendarPlus size={22} /> Create New Event
          </>
        )}
      </h2>

      <form onSubmit={onSubmit}>
        {/* ===== TITLE ===== */}
        <div className="form-group">
          <label>Event Title</label>
          <input
            type="text"
            name="title"
            placeholder="Enter event title..."
            value={editEvent?.title || ""}
            onChange={onChange}
            required
          />
        </div>

        {/* ===== DESCRIPTION ===== */}
        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            placeholder="Describe the event details..."
            value={editEvent?.description || ""}
            onChange={onChange}
            required
          />
        </div>
        
        {/* --- [NEW] TAGS INPUT --- */}
        <div className="form-group">
          <label>Tags</label>
          <input
            type="text"
            name="tags"
            placeholder="e.g., hackathon, ai, tech, workshop"
            value={tagsString}
            onChange={handleTagsChange} // Use custom handler
          />
          <small>Use commas (,) to separate tags.</small>
        </div>
        {/* ----------------------- */}

        {/* ===== DATE + LOCATION ===== */}
        <div className="form-row">
          <div className="form-group half">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={editEvent?.date?.slice(0, 10) || ""}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-group half">
            <label>Location</label>
            <input
              type="text"
              name="location" // <-- Fixed: was 'venue' in your original file
              placeholder="Event location..."
              value={editEvent?.location || ""}
              onChange={onChange}
              required
            />
          </div>
        </div>

        {/* ===== SUBMIT BUTTON ===== */}
        <button type="submit" className="btn-primary form-submit">
          {editEvent?._id ? "Update Event" : "Create Event"}
        </button>
      </form>
    </div>
  );
}