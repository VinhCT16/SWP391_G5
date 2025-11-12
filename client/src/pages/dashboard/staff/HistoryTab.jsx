import React from 'react';
import StatusBadge from '../../../components/shared/StatusBadge';

export default function HistoryTab({ tasks }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'assigned': return '#2196f3';
      case 'in-progress': return '#9c27b0';
      case 'blocked': return '#795548';
      case 'overdue': return '#e91e63';
      case 'completed': return '#4caf50';
      case 'cancelled': return '#f44336';
      default: return '#666';
    }
  };

  const stats = {
    total: tasks.length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  return (
    <div className="dashboard-section">
      <h3>My Performance</h3>
      <div className="stats-grid">
        <div className="stat-card"><span>Total</span><strong>{stats.total}</strong></div>
        <div className="stat-card"><span>In Progress</span><strong>{stats.inProgress}</strong></div>
        <div className="stat-card"><span>Blocked</span><strong>{stats.blocked}</strong></div>
        <div className="stat-card"><span>Completed</span><strong>{stats.completed}</strong></div>
      </div>
      <div className="history-list">
        <h4>Recent Tasks</h4>
        {tasks.slice(0, 10).map(t => (
          <div key={`${t.taskId}-history`} className="history-item">
            <span>#{t.requestNumber} • {t.taskType}</span>
            <StatusBadge status={t.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

