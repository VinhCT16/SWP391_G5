import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import adminApi from '../api/adminApi';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customerStats, setCustomerStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [complaintStats, setComplaintStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0
  });
  const [customerPagination, setCustomerPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCustomers: 0
  });
  const [filters, setFilters] = useState({
    role: '',
    search: '',
    isActive: ''
  });
  const [customerFilters, setCustomerFilters] = useState({
    search: '',
    isActive: ''
  });
  const [complaintPagination, setComplaintPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalComplaints: 0
  });
  const [complaintFilters, setComplaintFilters] = useState({
    status: '',
    priority: '',
    category: ''
  });
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer'
  });

  // Load user statistics
  useEffect(() => {
    loadUserStats();
    loadCustomerStats();
    loadComplaintStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const response = await adminApi.getUserStats();
      setUserStats(response.data);
    } catch (err) {
      setError('Failed to load user statistics');
    }
  };

  const loadCustomerStats = async () => {
    try {
      const response = await adminApi.getCustomerStats();
      setCustomerStats(response.data);
    } catch (err) {
      setError('Failed to load customer statistics');
    }
  };

  const loadComplaintStats = async () => {
    try {
      const response = await adminApi.getComplaintStats();
      setComplaintStats(response.data);
    } catch (err) {
      setError('Failed to load complaint statistics');
    }
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.currentPage,
        limit: 10,
        ...filters
      };
      const response = await adminApi.getAllUsers(params);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, filters]);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: customerPagination.currentPage,
        limit: 10,
        ...customerFilters
      };
      const response = await adminApi.getAllCustomers(params);
      setCustomers(response.data.customers);
      setCustomerPagination(response.data.pagination);
    } catch (err) {
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [customerPagination.currentPage, customerFilters]);

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: complaintPagination.currentPage,
        limit: 10,
        ...complaintFilters
      };
      const response = await adminApi.getAllComplaints(params);
      setComplaints(response.data.complaints);
      setComplaintPagination(response.data.pagination);
    } catch (err) {
      setError('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [complaintPagination.currentPage, complaintFilters]);

  // Load users when filters change
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Load customers when filters change
  useEffect(() => {
    if (activeTab === 'customers') {
      loadCustomers();
    }
  }, [loadCustomers, activeTab]);

  // Load complaints when filters change
  useEffect(() => {
    if (activeTab === 'complaints') {
      loadComplaints();
    }
  }, [loadComplaints, activeTab]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleCustomerFilterChange = (key, value) => {
    setCustomerFilters(prev => ({ ...prev, [key]: value }));
    setCustomerPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleCustomerPageChange = (page) => {
    setCustomerPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleComplaintFilterChange = (key, value) => {
    setComplaintFilters(prev => ({ ...prev, [key]: value }));
    setComplaintPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleComplaintPageChange = (page) => {
    setComplaintPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await adminApi.createUser(newUser);
      setShowAddUserModal(false);
      setNewUser({ name: '', email: '', password: '', phone: '', role: 'customer' });
      await loadUsers();
      await loadUserStats();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId, role) => {
    try {
      await adminApi.updateUser(userId, { role });
      await loadUsers();
      await loadUserStats();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update role');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await adminApi.toggleUserStatus(userId, !currentStatus);
      loadUsers();
      loadUserStats();
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminApi.deleteUser(userId);
        loadUsers();
        loadUserStats();
      } catch (err) {
        setError('Failed to delete user');
      }
    }
  };

  const handleToggleCustomerStatus = async (customerId, currentStatus, reason) => {
    try {
      await adminApi.updateCustomerAccount(customerId, { 
        isActive: !currentStatus, 
        reason: reason || 'Account status changed by admin' 
      });
      loadCustomers();
      loadCustomerStats();
    } catch (err) {
      setError('Failed to update customer status');
    }
  };

  const handleUpdateCustomer = async (customerId, customerData) => {
    try {
      await adminApi.updateCustomerAccount(customerId, customerData);
      loadCustomers();
    } catch (err) {
      setError('Failed to update customer');
    }
  };

  const handleComplaintAction = async (complaintId, action, data) => {
    try {
      await adminApi.handleCustomerComplaint(complaintId, { action, ...data });
      loadComplaints();
      loadComplaintStats();
    } catch (err) {
      setError('Failed to handle complaint');
    }
  };

  const renderOverview = () => (
    <div className="admin-overview">
      <h2>Dashboard Overview</h2>
      {userStats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p className="stat-number">{userStats.totalUsers}</p>
          </div>
          <div className="stat-card">
            <h3>Active Users</h3>
            <p className="stat-number">{userStats.activeUsers}</p>
          </div>
          <div className="stat-card">
            <h3>Locked Users</h3>
            <p className="stat-number">{userStats.lockedUsers}</p>
          </div>
        </div>
      )}

      {customerStats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Customers</h3>
            <p className="stat-number">{customerStats.totalCustomers}</p>
          </div>
          <div className="stat-card">
            <h3>Active Customers</h3>
            <p className="stat-number">{customerStats.activeCustomers}</p>
          </div>
          <div className="stat-card">
            <h3>Locked Customers</h3>
            <p className="stat-number">{customerStats.lockedCustomers}</p>
          </div>
          <div className="stat-card">
            <h3>Total Reviews</h3>
            <p className="stat-number">{customerStats.totalReviews}</p>
          </div>
          <div className="stat-card">
            <h3>Total Requests</h3>
            <p className="stat-number">{customerStats.totalRequests}</p>
          </div>
        </div>
      )}

      {complaintStats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Complaints</h3>
            <p className="stat-number">{complaintStats.totalComplaints}</p>
          </div>
          <div className="stat-card">
            <h3>Pending</h3>
            <p className="stat-number">{complaintStats.pendingComplaints}</p>
          </div>
          <div className="stat-card">
            <h3>In Progress</h3>
            <p className="stat-number">{complaintStats.inProgressComplaints}</p>
          </div>
          <div className="stat-card">
            <h3>Resolved</h3>
            <p className="stat-number">{complaintStats.resolvedComplaints}</p>
          </div>
          <div className="stat-card">
            <h3>Closed</h3>
            <p className="stat-number">{complaintStats.closedComplaints}</p>
          </div>
        </div>
      )}

      {userStats?.roleStats && (
        <div className="role-stats">
          <h3>Users by Role</h3>
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
        <div className="recent-users">
          <h3>Recent Users</h3>
          <div className="recent-list">
            {userStats.recentUsers.map(user => (
              <div key={user._id} className="recent-item">
                <div>
                  <strong>{user.name}</strong>
                  <span className="user-role">{user.role}</span>
                </div>
                <span className="user-date">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderUserManagement = () => (
    <div className="user-management">
      <div className="management-header">
        <h2>User Management</h2>
        <button className="btn-primary" onClick={() => setShowAddUserModal(true)}>Add New User</button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search users..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="search-input"
        />
        <select
          value={filters.role}
          onChange={(e) => handleFilterChange('role', e.target.value)}
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
          onChange={(e) => handleFilterChange('isActive', e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Locked</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <div className="users-table">
          <table>
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
                      onChange={(e) => handleUpdateUserRole(user._id, e.target.value)}
                      className="role-select"
                    >
                      <option value="customer">customer</option>
                      <option value="staff">staff</option>
                      <option value="manager">manager</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'locked'}`}>
                      {user.isActive ? 'Active' : 'Locked'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                        className={`btn-small ${user.isActive ? 'btn-warning' : 'btn-success'}`}
                      >
                        {user.isActive ? 'Lock' : 'Unlock'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="btn-small btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="btn-pagination"
            >
              Previous
            </button>
            <span>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
              className="btn-pagination"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderCustomerManagement = () => (
    <div className="customer-management">
      <div className="management-header">
        <h2>Customer Management</h2>
        <div className="customer-stats">
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
          value={customerFilters.search}
          onChange={(e) => handleCustomerFilterChange('search', e.target.value)}
          className="search-input"
        />
        <select
          value={customerFilters.isActive}
          onChange={(e) => handleCustomerFilterChange('isActive', e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Locked</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading customers...</div>
      ) : (
        <div className="customers-table">
          <table>
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
                    <span className={`status-badge ${customer.isActive ? 'active' : 'locked'}`}>
                      {customer.isActive ? 'Active' : 'Locked'}
                    </span>
                  </td>
                  <td>{customer.totalReviews || 0}</td>
                  <td>{customer.totalRequests || 0}</td>
                  <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => {
                          const reason = prompt('Reason for status change (optional):');
                          handleToggleCustomerStatus(customer._id, customer.isActive, reason);
                        }}
                        className={`btn-small ${customer.isActive ? 'btn-warning' : 'btn-success'}`}
                      >
                        {customer.isActive ? 'Lock' : 'Unlock'}
                      </button>
                      <button
                        onClick={() => {
                          const newName = prompt('Enter new name:', customer.name);
                          const newPhone = prompt('Enter new phone:', customer.phone || '');
                          if (newName && newName !== customer.name) {
                            handleUpdateCustomer(customer._id, { name: newName, phone: newPhone });
                          }
                        }}
                        className="btn-small btn-info"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button
              onClick={() => handleCustomerPageChange(customerPagination.currentPage - 1)}
              disabled={!customerPagination.hasPrev}
              className="btn-pagination"
            >
              Previous
            </button>
            <span>
              Page {customerPagination.currentPage} of {customerPagination.totalPages}
            </span>
            <button
              onClick={() => handleCustomerPageChange(customerPagination.currentPage + 1)}
              disabled={!customerPagination.hasNext}
              className="btn-pagination"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderComplaintManagement = () => (
    <div className="complaint-management">
      <div className="management-header">
        <h2>Complaint Management</h2>
        <div className="complaint-stats">
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
          value={complaintFilters.status}
          onChange={(e) => handleComplaintFilterChange('status', e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={complaintFilters.priority}
          onChange={(e) => handleComplaintFilterChange('priority', e.target.value)}
          className="filter-select"
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select
          value={complaintFilters.category}
          onChange={(e) => handleComplaintFilterChange('category', e.target.value)}
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
        <div className="loading">Loading complaints...</div>
      ) : (
        <div className="complaints-table">
          <table>
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
              {complaints.map(complaint => (
                <tr key={complaint._id}>
                  <td>
                    <div>
                      <strong>{complaint.customerId?.name || complaint.customerName}</strong>
                      <br />
                      <small>{complaint.customerId?.email || complaint.customerEmail}</small>
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
                    <span className={`status-badge status-${complaint.status}`}>
                      {complaint.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-badge priority-${complaint.priority}`}>
                      {complaint.priority}
                    </span>
                  </td>
                  <td>{complaint.category.replace('_', ' ')}</td>
                  <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => {
                          const response = prompt('Enter your response:');
                          if (response) {
                            handleComplaintAction(complaint._id, 'respond', { response });
                          }
                        }}
                        className="btn-small btn-info"
                      >
                        Respond
                      </button>
                      <button
                        onClick={() => {
                          const resolution = prompt('Enter resolution details:');
                          if (resolution) {
                            handleComplaintAction(complaint._id, 'resolve', { response: resolution });
                          }
                        }}
                        className="btn-small btn-success"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Close this complaint?')) {
                            handleComplaintAction(complaint._id, 'close', {});
                          }
                        }}
                        className="btn-small btn-warning"
                      >
                        Close
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button
              onClick={() => handleComplaintPageChange(complaintPagination.currentPage - 1)}
              disabled={!complaintPagination.hasPrev}
              className="btn-pagination"
            >
              Previous
            </button>
            <span>
              Page {complaintPagination.currentPage} of {complaintPagination.totalPages}
            </span>
            <button
              onClick={() => handleComplaintPageChange(complaintPagination.currentPage + 1)}
              disabled={!complaintPagination.hasNext}
              className="btn-pagination"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (user?.role !== 'admin') {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You don't have permission to access the admin dashboard.</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {user?.name}</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button
          className={`tab-button ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          Customer Management
        </button>
        <button
          className={`tab-button ${activeTab === 'complaints' ? 'active' : ''}`}
          onClick={() => setActiveTab('complaints')}
        >
          Complaint Management
        </button>
        <button
          className={`tab-button ${activeTab === 'staff' ? 'active' : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          Staff Management
        </button>
        <button
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="admin-content">
        {error && <div className="error-message">{error}</div>}
        
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUserManagement()}
        {activeTab === 'customers' && renderCustomerManagement()}
        {activeTab === 'complaints' && renderComplaintManagement()}
        {activeTab === 'staff' && (
          <div className="staff-management">
            <h2>Staff Management</h2>
            <p>Staff management features coming soon...</p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="admin-settings">
            <h2>Admin Settings</h2>
            <p>Admin settings coming soon...</p>
          </div>
        )}
      </div>

      {showAddUserModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New User</h3>
            <form onSubmit={handleCreateUser} className="form-grid">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="customer">Customer</option>
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddUserModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
