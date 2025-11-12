import React from 'react';
import Button from '../../../components/shared/Button';
import StatusBadge from '../../../components/shared/StatusBadge';

const getStatusStyle = (status) => {
  switch(status) {
    case 'pending': return { bg: '#fff3cd', color: '#856404' };
    case 'in_progress': return { bg: '#d1ecf1', color: '#0c5460' };
    case 'resolved': return { bg: '#d4edda', color: '#155724' };
    case 'closed': return { bg: '#f8d7da', color: '#721c24' };
    default: return { bg: '#f5f5f5', color: '#666' };
  }
};

const getPriorityStyle = (priority) => {
  switch(priority) {
    case 'low': return { bg: '#e9ecef', color: '#495057' };
    case 'medium': return { bg: '#fff3cd', color: '#856404' };
    case 'high': return { bg: '#f8d7da', color: '#721c24' };
    case 'urgent': return { bg: '#f5c6cb', color: '#721c24', fontWeight: 'bold' };
    default: return { bg: '#f5f5f5', color: '#666' };
  }
};

export default function ComplaintManagementTab({
  complaints,
  loading,
  complaintStats,
  filters,
  pagination,
  onFilterChange,
  onPageChange,
  onAction
}) {
  return (
    <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div className="management-header">
        <h2>Complaint Management</h2>
        <div>
          {complaintStats && (
            <div className="quick-stats">
              <span>Total: {complaintStats.totalComplaints}</span>
              <span>Pending: {complaintStats.pendingComplaints}</span>
              <span>Resolved: {complaintStats.resolvedComplaints}</span>
            </div>
          )}
        </div>
      </div>

      <div className="filters">
        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={filters.priority}
          onChange={(e) => onFilterChange('priority', e.target.value)}
          className="filter-select"
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select
          value={filters.category}
          onChange={(e) => onFilterChange('category', e.target.value)}
          className="filter-select"
        >
          <option value="">All Categories</option>
          <option value="service_quality">Service Quality</option>
          <option value="billing">Billing</option>
          <option value="technical">Technical</option>
          <option value="general">General</option>
          <option value="other">Other</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-state">Loading complaints...</div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Category</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map(complaint => {
                const statusStyle = getStatusStyle(complaint.status);
                const priorityStyle = getPriorityStyle(complaint.priority);
                return (
                  <tr key={complaint._id}>
                    <td>
                      <div>
                        <strong>{complaint.customerId?.name || complaint.customerName}</strong>
                        <br />
                        <small style={{ color: '#666' }}>{complaint.customerId?.email || complaint.customerEmail}</small>
                      </div>
                    </td>
                    <td>
                      <div className="complaint-subject">
                        {complaint.subject}
                        {complaint.description && (
                          <div className="complaint-description">
                            {complaint.description.length > 100 
                              ? `${complaint.description.substring(0, 100)}...` 
                              : complaint.description
                            }
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={complaint.status} />
                    </td>
                    <td>
                      <span style={{ ...statusStyle, padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                        {complaint.priority}
                      </span>
                    </td>
                    <td>{complaint.category.replace('_', ' ')}</td>
                    <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <Button
                          variant="info"
                          size="small"
                          onClick={() => {
                            const response = prompt('Enter your response:');
                            if (response) {
                              onAction(complaint._id, 'respond', { response });
                            }
                          }}
                        >
                          Respond
                        </Button>
                        <Button
                          variant="success"
                          size="small"
                          onClick={() => {
                            const resolution = prompt('Enter resolution details:');
                            if (resolution) {
                              onAction(complaint._id, 'resolve', { response: resolution });
                            }
                          }}
                        >
                          Resolve
                        </Button>
                        <Button
                          variant="warning"
                          size="small"
                          onClick={() => {
                            if (window.confirm('Close this complaint?')) {
                              onAction(complaint._id, 'close', {});
                            }
                          }}
                        >
                          Close
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="pagination">
            <button
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="pagination-btn"
            >
              Previous
            </button>
            <span>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

