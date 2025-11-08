import React, { useEffect, useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/events')
      .then((res) => {
        console.log('Fetched events:', res.data);
        setEvents(res.data);
      })
      .catch((err) => {
        console.error('Error fetching events:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading events...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>All Campus Events</h2>
      {events.length === 0 ? (
        <p>No events available.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {events.map((event) => (
            <div
              key={event._id}
              style={{
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: 12,
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/event/${event._id}`)}
            >
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              <small>
                {new Date(event.date).toLocaleDateString()} |{' '}
                {event.location || 'TBA'}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
