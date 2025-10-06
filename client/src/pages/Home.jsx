import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, logout } = useAuth();
  return (
    <div style={{ maxWidth: 600, margin: '40px auto' }}>
      <h2>Welcome{user ? `, ${user.name}` : ''}</h2>
      <p>This is a dummy homepage shown after login.</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}


