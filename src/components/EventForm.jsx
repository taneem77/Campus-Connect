import React from "react";
import { CalendarPlus, Edit } from "lucide-react";

export default function EventForm({ editEvent, onChange, onSubmit }) {
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
              name="location"
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
