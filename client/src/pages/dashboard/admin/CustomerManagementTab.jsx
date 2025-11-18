import React from 'react';
import Button from '../../../components/shared/Button';
import StatusBadge from '../../../components/shared/StatusBadge';

export default function CustomerManagementTab({
  customers,
  loading,
  customerStats,
  filters,
  pagination,
  onFilterChange,
  onPageChange,
  onToggleStatus,
  onUpdate,
  onViewCustomerDetails,
  onViewCustomerComplaints
}) {
  return (
    <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div className="management-header">
        <h2>Customer Management</h2>
        <div>
          {customerStats && (
            <div className="quick-stats">
              <span>Total: {customerStats.totalCustomers}</span>
              <span>Active: {customerStats.activeCustomers}</span>
              <span>Locked: {customerStats.lockedCustomers}</span>
            </div>
          )}
        </div>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search customers..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="filter-input"
        />
        <select
          value={filters.isActive}
          onChange={(e) => onFilterChange('isActive', e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Locked</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-state">Loading customers...</div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Reviews</th>
                <th>Requests</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer._id}>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone || 'N/A'}</td>
                  <td>
                    <StatusBadge status={customer.isActive ? 'active' : 'locked'} />
                  </td>
                  <td>{customer.totalReviews || 0}</td>
                  <td>{customer.totalRequests || 0}</td>
                  <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Button
                        variant="info"
                        size="small"
                        onClick={() => onViewCustomerDetails(customer._id)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => onViewCustomerComplaints(customer._id)}
                      >
                        View Complaints
                      </Button>
                      <Button
                        variant={customer.isActive ? 'warning' : 'success'}
                        size="small"
                        onClick={() => {
                          const reason = prompt('Reason for status change (optional):');
                          onToggleStatus(customer._id, customer.isActive, reason);
                        }}
                      >
                        {customer.isActive ? 'Lock' : 'Unlock'}
                      </Button>
                      <Button
                        variant="info"
                        size="small"
                        onClick={() => {
                          const newName = prompt('Enter new name:', customer.name);
                          const newPhone = prompt('Enter new phone:', customer.phone || '');
                          if (newName && newName !== customer.name) {
                            onUpdate(customer._id, { name: newName, phone: newPhone });
                          }
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
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

