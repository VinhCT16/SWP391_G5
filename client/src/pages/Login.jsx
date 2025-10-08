import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const { login, user, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed');
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
              <h2>Welcome Back</h2>
              <p>Sign in to manage your moving needs</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
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
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="auth-link">
                  Create Account
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


