import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api';

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    API.get(`/events/${id}`)
      .then(res => setEvent(res.data))
      .catch(err => console.error(err));
  }, [id]);

  const handleRSVP = async () => {
    try {
      await API.post(`/events/${id}/rsvp`);
      setMsg('Enrolled successfully');
      // reload event
      const res = await API.get(`/events/${id}`);
      setEvent(res.data);
    } catch (err) {
      setMsg(err?.response?.data?.message || 'RSVP failed');
    }
  };

  if (!event) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>{event.title}</h2>
      <p>{event.description}</p>
      <p><strong>Date:</strong> {new Date(event.date).toLocaleString()}</p>
      <p><strong>Location:</strong> {event.location || 'TBA'}</p>
      <p><strong>Created by:</strong> {event.createdBy?.name || 'Unknown'}</p>

      <button onClick={handleRSVP}>Enroll / RSVP</button>
      {msg && <div style={{ marginTop: 12 }}>{msg}</div>}

      <h3 style={{ marginTop: 20 }}>Attendees ({event.rsvps?.length || 0})</h3>
      <ul>
        {event.rsvps?.map(u => <li key={u._id}>{u.name} — {u.email}</li>)}
      </ul>
    </div>
  );
}
