import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Home.css';

export default function Home() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <div className="logo">
            <h1>MoveEase</h1>
            <span>Professional Moving Services</span>
          </div>
          <div className="user-info">
            <span>Welcome, {user?.name}</span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <nav className="home-nav">
        <button 
          className={activeTab === 'dashboard' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'book-move' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('book-move')}
        >
          Book a Move
        </button>
        <button 
          className={activeTab === 'my-moves' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('my-moves')}
        >
          My Moves
        </button>
        <button 
          className={activeTab === 'profile' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
      </nav>

      <main className="home-main">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <div className="welcome-section">
              <h2>Welcome back, {user?.name}!</h2>
              <p>Manage your moving needs with ease</p>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card">
                <h3>0</h3>
                <p>Completed Moves</p>
              </div>
              <div className="stat-card">
                <h3>0</h3>
                <p>Upcoming Moves</p>
              </div>
              <div className="stat-card">
                <h3>$0</h3>
                <p>Total Spent</p>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button className="action-btn primary" onClick={() => setActiveTab('book-move')}>
                  Book New Move
                </button>
                <button className="action-btn secondary" onClick={() => setActiveTab('my-moves')}>
                  View My Moves
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'book-move' && (
          <div className="book-move">
            <h2>Book Your Move</h2>
            <div className="booking-form">
              <div className="form-section">
                <h3>Move Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Moving From</label>
                    <input type="text" placeholder="Current address" />
                  </div>
                  <div className="form-group">
                    <label>Moving To</label>
                    <input type="text" placeholder="Destination address" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Moving Date</label>
                    <input type="date" />
                  </div>
                  <div className="form-group">
                    <label>Service Type</label>
                    <select>
                      <option>Local Move</option>
                      <option>Long Distance</option>
                      <option>Commercial</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h3>Contact Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" placeholder="Your phone number" />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={user?.email} readOnly />
                  </div>
                </div>
              </div>

              <button className="submit-btn">Get Quote</button>
            </div>
          </div>
        )}

        {activeTab === 'my-moves' && (
          <div className="my-moves">
            <h2>My Moves</h2>
            <div className="moves-list">
              <div className="empty-state">
                <h3>No moves booked yet</h3>
                <p>Book your first move to get started!</p>
                <button className="action-btn primary" onClick={() => setActiveTab('book-move')}>
                  Book a Move
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile">
            <h2>My Profile</h2>
            <div className="profile-info">
              <div className="profile-section">
                <h3>Personal Information</h3>
                <div className="info-row">
                  <span className="label">Name:</span>
                  <span className="value">{user?.name}</span>
                </div>
                <div className="info-row">
                  <span className="label">Email:</span>
                  <span className="value">{user?.email}</span>
                </div>
              </div>
              
              <div className="profile-section">
                <h3>Account Settings</h3>
                <button className="action-btn secondary">Update Profile</button>
                <button className="action-btn secondary">Change Password</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


