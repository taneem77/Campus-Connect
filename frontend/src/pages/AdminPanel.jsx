import React, { useEffect, useState } from 'react';
import API from '../api';

export default function AdminPanel() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', date: '', location: '' });
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState('');

  const fetchEvents = () => {
    API.get('/events').then(res => setEvents(res.data)).catch(err => console.error(err));
  };

  useEffect(() => fetchEvents(), []);

  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submitCreate = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.put(`/events/${editingId}`, form);
        setMsg('Event updated');
      } else {
        await API.post('/events/create', form);
        setMsg('Event created');
      }
      setForm({ title: '', description: '', date: '', location: '' });
      setEditingId(null);
      fetchEvents();
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (ev) => {
    setEditingId(ev._id);
    setForm({
      title: ev.title,
      description: ev.description || '',
      date: new Date(ev.date).toISOString().slice(0,16),
      location: ev.location || ''
    });
    setMsg('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete event?')) return;
    try {
      await API.delete(`/events/${id}`);
      setMsg('Event deleted');
      fetchEvents();
    } catch (err) {
      setMsg('Delete failed');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Panel — Manage Events</h2>
      {msg && <div style={{ marginBottom: 12 }}>{msg}</div>}

      <form onSubmit={submitCreate} style={{ display: 'grid', gap: 8, width: 480 }}>
        <input name="title" value={form.title} onChange={onChange} placeholder="Title" required />
        <textarea name="description" value={form.description} onChange={onChange} placeholder="Description" />
        <input name="date" value={form.date} onChange={onChange} type="datetime-local" required />
        <input name="location" value={form.location} onChange={onChange} placeholder="Location" />
        <button type="submit">{editingId ? 'Update Event' : 'Create Event'}</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ title:'', description:'', date:'', location:''}); }}>Cancel edit</button>}
      </form>

      <h3 style={{ marginTop: 20 }}>All Events</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        {events.map(ev => (
          <div key={ev._id} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
            <strong>{ev.title}</strong> — {new Date(ev.date).toLocaleString()}
            <div>
              <button onClick={() => handleEdit(ev)} style={{ marginRight: 8 }}>Edit</button>
              <button onClick={() => handleDelete(ev._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
