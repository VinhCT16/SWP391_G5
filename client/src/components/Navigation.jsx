import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navigation() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Don't show navigation on landing, login, or register pages
  if (['/', '/login', '/register'].includes(location.pathname)) {
    return null;
  }

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="brand-link">
            <h2>MoveEase</h2>
            <span>Professional Moving Services</span>
          </Link>
        </div>

        <div className="nav-links">
          {user && (
            <>
              <Link 
                to="/dashboard" 
                className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              >
                Dashboard
              </Link>
              
              {user.role === 'customer' && (
                <Link 
                  to="/customer-dashboard" 
                  className={`nav-link ${location.pathname === '/customer-dashboard' ? 'active' : ''}`}
                >
                  My Moves
                </Link>
              )}
              
              {user.role === 'manager' && (
                <Link 
                  to="/manager-dashboard" 
                  className={`nav-link ${location.pathname === '/manager-dashboard' ? 'active' : ''}`}
                >
                  Manager Panel
                </Link>
              )}
              
              {user.role === 'staff' && (
                <Link 
                  to="/staff-dashboard" 
                  className={`nav-link ${location.pathname === '/staff-dashboard' ? 'active' : ''}`}
                >
                  Staff Panel
                </Link>
              )}

              {user.role === 'admin' && (
                <Link 
                  to="/admin-dashboard" 
                  className={`nav-link ${location.pathname === '/admin-dashboard' ? 'active' : ''}`}
                >
                  Admin Panel
                </Link>
              )}

              <Link to="/about" className="nav-link">About</Link>
            </>
          )}
        </div>

        <div className="nav-user">
          {user ? (
            <div className="user-menu">
              <span className="user-name">Welcome, {user.name}</span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link btn-primary">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
