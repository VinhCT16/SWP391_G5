import React from 'react';
import Button from '../../../components/shared/Button';
import StatusBadge from '../../../components/shared/StatusBadge';

export default function UserManagementTab({
  users,
  loading,
  filters,
  pagination,
  onFilterChange,
  onPageChange,
  onUpdateRole,
  onToggleStatus,
  onDelete,
  onAddUser,
  onViewUserDetails,
  onResetPassword
}) {
  return (
    <div>
      <div className="management-header">
        <h2>User Management</h2>
        <Button onClick={onAddUser}>Add New User</Button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search users..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="filter-input"
        />
        <select
          value={filters.role}
          onChange={(e) => onFilterChange('role', e.target.value)}
          className="filter-select"
        >
          <option value="">All Roles</option>
          <option value="customer">Customer</option>
          <option value="staff">Staff</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
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
        <div className="loading-state">Loading users...</div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) => onUpdateRole(user._id, e.target.value)}
                      className="filter-select"
                    >
                      <option value="customer">customer</option>
                      <option value="staff">staff</option>
                      <option value="manager">manager</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>
                    <StatusBadge status={user.isActive ? 'active' : 'locked'} />
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Button
                        variant="info"
                        size="small"
                        onClick={() => onViewUserDetails(user._id)}
                      >
                        View
                      </Button>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => onResetPassword(user._id)}
                      >
                        Reset Password
                      </Button>
                      <Button
                        variant={user.isActive ? 'warning' : 'success'}
                        size="small"
                        onClick={() => onToggleStatus(user._id, user.isActive)}
                      >
                        {user.isActive ? 'Lock' : 'Unlock'}
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => onDelete(user._id)}
                      >
                        Delete
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

