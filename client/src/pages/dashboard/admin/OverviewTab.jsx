import React from 'react';

export default function OverviewTab({ userStats, customerStats, complaintStats }) {
  return (
    <div>
      <h2>Dashboard Overview</h2>
      {userStats ? (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff', margin: 0 }}>
              {userStats.totalUsers || 0}
            </p>
          </div>
          <div className="stat-card">
            <h3>Active Users</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff', margin: 0 }}>
              {userStats.activeUsers || 0}
            </p>
          </div>
          <div className="stat-card">
            <h3>Locked Users</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff', margin: 0 }}>
              {userStats.lockedUsers || 0}
            </p>
          </div>
        </div>
      ) : (
        <div className="loading-state">Loading user statistics...</div>
      )}

      {customerStats ? (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Customers</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff', margin: 0 }}>
              {customerStats.totalCustomers || 0}
            </p>
          </div>
          <div className="stat-card">
            <h3>Active Customers</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff', margin: 0 }}>
              {customerStats.activeCustomers || 0}
            </p>
          </div>
          <div className="stat-card">
            <h3>Locked Customers</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff', margin: 0 }}>
              {customerStats.lockedCustomers || 0}
            </p>
          </div>
          <div className="stat-card">
            <h3>Total Reviews</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff', margin: 0 }}>
              {customerStats.totalReviews || 0}
            </p>
          </div>
          <div className="stat-card">
            <h3>Total Requests</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff', margin: 0 }}>
              {customerStats.totalRequests || 0}
            </p>
          </div>
        </div>
      ) : (
        <div className="loading-state">Loading customer statistics...</div>
      )}

      {complaintStats ? (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Complaints</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff', margin: 0 }}>
              {complaintStats.totalComplaints || 0}
            </p>
          </div>
          <div className="stat-card">
            <h3>Pending</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff', margin: 0 }}>
              {complaintStats.pendingComplaints || 0}
            </p>
          </div>
          <div className="stat-card">
            <h3>In Progress</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff', margin: 0 }}>
              {complaintStats.inProgressComplaints || 0}
            </p>
          </div>
          <div className="stat-card">
            <h3>Resolved</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff', margin: 0 }}>
              {complaintStats.resolvedComplaints || 0}
            </p>
          </div>
          <div className="stat-card">
            <h3>Closed</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff', margin: 0 }}>
              {complaintStats.closedComplaints || 0}
            </p>
          </div>
        </div>
      ) : (
        <div className="loading-state">Loading complaint statistics...</div>
      )}

      {userStats?.roleStats && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>Users by Role</h3>
          <div className="role-grid">
            {userStats.roleStats.map(role => (
              <div key={role._id} className="role-card">
                <h4>{role._id.charAt(0).toUpperCase() + role._id.slice(1)}</h4>
                <p>{role.count} users</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {userStats?.recentUsers && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>Recent Users</h3>
          <div className="recent-list">
            {userStats.recentUsers.map(user => (
              <div key={user._id} className="recent-item">
                <div>
                  <strong style={{ color: '#333' }}>{user.name}</strong>
                  <span className="user-role">{user.role}</span>
                </div>
                <span style={{ color: '#666', fontSize: '14px' }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

