import React from 'react';
import Button from '../../../components/shared/Button';

export default function DashboardTab({ user, requests, onTabChange }) {
  const stats = {
    completed: requests.filter(r => r.status === 'completed').length,
    active: requests.filter(r => ['submitted', 'approved', 'contract_created', 'in_progress'].includes(r.status)).length,
    total: requests.length
  };

  return (
    <div className="dashboard-section">
      <div className="welcome-section">
        <h2>Welcome back, {user?.name}!</h2>
        <p>Manage your moving needs with ease</p>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.completed}</h3>
          <p>Completed Moves</p>
        </div>
        <div className="stat-card">
          <h3>{stats.active}</h3>
          <p>Active Moves</p>
        </div>
        <div className="stat-card">
          <h3>{stats.total}</h3>
          <p>Total Requests</p>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <Button onClick={() => onTabChange('book-move')}>
            📦 Book New Move
          </Button>
          <Button variant="secondary" onClick={() => onTabChange('my-moves')}>
            📋 View My Moves
          </Button>
          <Button variant="info" onClick={() => onTabChange('profile')}>
            👤 My Profile
          </Button>
        </div>
      </div>
    </div>
  );
}

