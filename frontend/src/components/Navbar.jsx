import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        background: '#1E293B', // dark blue-gray
        color: 'white',
      }}
    >
      {/* --- LEFT SIDE --- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link
          to="/dashboard"
          style={{
            fontWeight: 'bold',
            fontSize: '18px',
            textDecoration: 'none',
            color: 'white',
          }}
        >
          Campus Connect
        </Link>

        {/* Common links visible to everyone */}
        {user && (
          <>
            <Link to="/dashboard" style={navLinkStyle}>
              Events
            </Link>
            <Link to="/eventlist" style={navLinkStyle}>
              Explore
            </Link>
          </>
        )}

        {/* Admin-only links */}
        {user?.role === 'admin' && (
          <>
            <Link to="/admin" style={navLinkStyle}>
              Admin Panel
            </Link>
            <Link to="/admin/manage" style={navLinkStyle}>
              Manage Events
            </Link>
          </>
        )}
      </div>

      {/* --- RIGHT SIDE --- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {user ? (
          <>
            <span style={{ fontSize: '14px' }}>
              👋 {user.name} ({user.role})
            </span>
            <button
              onClick={logout}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={navLinkStyle}>
              Login
            </Link>
            <Link to="/signup" style={navLinkStyle}>
              Signup
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

// 🧩 Common nav link styling
const navLinkStyle = {
  textDecoration: 'none',
  color: 'white',
  fontSize: '15px',
  transition: '0.2s',
};

