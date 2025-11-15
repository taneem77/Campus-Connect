import React, { useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addHours } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { toast } from "react-hot-toast";

// Setup the localizer
const locales = {
  "en-US": enUS,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: locales["en-US"] }),
  getDay,
  locales,
});

export default function CalendarPage({ events = [] }) {
  // We use useMemo to re-format the event data only when the 'events' prop changes
  const calendarEvents = useMemo(() => {
    return events.map((event) => {
      // Ensure the date is treated correctly
      const eventDate = new Date(event.date);
      return {
        title: event.title,
        start: eventDate, // Start time of the event
        end: addHours(eventDate, 1), // Assume 1 hour duration for this basic view
        resource: event, // Store the original event object
      };
    });
  }, [events]);

  // Handle clicking on an event in the calendar
  const handleSelectEvent = (calendarEvent) => {
    const { title, start } = calendarEvent;
    toast.success(
      `${title} on ${new Date(start).toLocaleDateString()}`,
      { icon: "🗓️" }
    );
  };

  return (
    <div className="calendar-container fade-in">
      <h1>Event Calendar</h1>
      <p>A visual overview of all upcoming and past events.</p>
      <div className="calendar-widget">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }} // Set a fixed height for the calendar
          onSelectEvent={handleSelectEvent} // Fire toast on click
        />
      </div>
    </div>
  );
}