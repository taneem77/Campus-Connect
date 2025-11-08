import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onChange = (e) => setForm(s => ({ ...s, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/users/login', form);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Sign in</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 400 }}>
        <input name="email" value={form.email} onChange={onChange} placeholder="Email" />
        <input type="password" name="password" value={form.password} onChange={onChange} placeholder="Password" />
        <button type="submit">Sign in</button>
      </form>
    </div>
  );
}
