import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function Register() {
  const { register, user, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    setLoading(true);
    try {
      await register({ name, email, password, phone, role: 'customer' });
      navigate('/login');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  // If user is already logged in, show a different message
  if (user) {
    return (
      <div className="auth-container">
        <div className="auth-background">
          <div className="auth-overlay"></div>
          <div className="auth-content">
            <div className="auth-card">
              <div className="auth-header">
                <div className="logo">
                  <h1>MoveEase</h1>
                  <span>Professional Moving Services</span>
                </div>
                <h2>Already Logged In</h2>
                <p>You are currently logged in as {user.name}</p>
              </div>
              <div className="auth-actions" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                  Go to Dashboard
                </button>
                <button onClick={handleLogout} className="btn btn-outline">
                  Logout
                </button>
              </div>
              <div className="auth-footer">
                <Link to="/">← Back to Home</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-overlay"></div>
        <div className="auth-content">
          <div className="auth-card">
            <div className="auth-header">
              <div className="logo">
                <h1>MoveEase</h1>
                <span>Professional Moving Services</span>
              </div>
              <h2>Create Account</h2>
              <p>Join thousands of satisfied customers</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min. 6 characters)"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm">Confirm Password</label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="auth-link">
                  Sign In
                </Link>
              </p>
            </div>

            <div className="auth-features">
              <div className="feature">
                <span className="feature-icon">🚚</span>
                <span>Professional Movers</span>
              </div>
              <div className="feature">
                <span className="feature-icon">📦</span>
                <span>Safe & Secure</span>
              </div>
              <div className="feature">
                <span className="feature-icon">💰</span>
                <span>Best Prices</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


