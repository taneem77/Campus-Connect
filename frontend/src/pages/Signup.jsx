import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onChange = (e) => setForm(s => ({ ...s, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/users/signup', form);
      alert('Signup successful — please login');
      navigate('/login');
    } catch (err) {
      setError(err?.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Create account</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
        <input name="name" value={form.name} onChange={onChange} placeholder="Full name" />
        <input name="email" value={form.email} onChange={onChange} placeholder="Email" />
        <input name="password" type="password" value={form.password} onChange={onChange} placeholder="Password" />
        <select name="role" value={form.role} onChange={onChange}>
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">Sign up</button>
      </form>
    </div>
  );
}
