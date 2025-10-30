import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const { login, user, logout } = useAuth();
  const navigate = useNavigate();
  const t = (s) => s; // placeholder no-op
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleLanguage = null;

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
      setError(err?.response?.data?.message || t('login.error.default'));
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
                  <h1>{t('app.name')}</h1>
                  <span>{t('app.tagline')}</span>
                </div>
                <h2>{t('login.alreadyLoggedIn.title')}</h2>
                <p>{t('login.alreadyLoggedIn.message', { name: user.name })}</p>
              </div>
              <div className="auth-actions" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                  {t('login.goToDashboard')}
                </button>
                <button onClick={handleLogout} className="btn btn-outline">
                  {t('login.logout')}
                </button>
              </div>
              <div className="auth-footer">
                <Link to="/">{t('common.backHome')}</Link>
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
                <h1>Moving Service</h1>
                <span>Fast. Safe. Reliable.</span>
              </div>
              <h2>Sign in</h2>
              <p>Access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
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
                  placeholder="••••••••"
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
                    {t('login.submitting')}
                  </>
                ) : (
                  t('login.submit')
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                {t('login.noAccount')}{' '}
                <Link to="/register" className="auth-link">
                  {t('login.createAccount')}
                </Link>
              </p>
            </div>

            <div className="auth-features">
              <div className="feature">
                <span className="feature-icon">🚚</span>
                <span>{t('features.movers')}</span>
              </div>
              <div className="feature">
                <span className="feature-icon">📦</span>
                <span>{t('features.secure')}</span>
              </div>
              <div className="feature">
                <span className="feature-icon">💰</span>
                <span>{t('features.prices')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


