import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import adminApi from '../api/adminApi';

const AdminDashboard = () => {
  const { user } = useAuth();
  
  // Inline styles
  const styles = {
    dashboard: {
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    },
    header: {
      marginBottom: '30px',
      paddingBottom: '20px',
      borderBottom: '2px solid #e0e0e0'
    },
    headerH1: {
      color: '#333',
      marginBottom: '5px'
    },
    headerP: {
      color: '#666',
      fontSize: '16px'
    },
    tabs: {
      display: 'flex',
      gap: '10px',
      marginBottom: '30px',
      borderBottom: '1px solid #e0e0e0'
    },
    tabButton: {
      padding: '12px 24px',
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      fontSize: '16px',
      color: '#666',
      borderBottom: '3px solid transparent',
      transition: 'all 0.3s ease'
    },
    tabButtonActive: {
      color: '#007bff',
      borderBottomColor: '#007bff',
      fontWeight: '600'
    },
    content: {
      minHeight: '400px'
    },
    overview: {},
    overviewH2: {
      color: '#333',
      marginBottom: '20px'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    statCard: {
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      textAlign: 'center'
    },
    statCardH3: {
      color: '#666',
      fontSize: '14px',
      marginBottom: '10px',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    statNumber: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#007bff',
      margin: '0'
    },
    loading: {
      textAlign: 'center',
      padding: '40px',
      color: '#666',
      fontSize: '16px'
    },
    errorMessage: {
      background: '#f8d7da',
      color: '#721c24',
      padding: '12px',
      borderRadius: '4px',
      marginBottom: '20px',
      border: '1px solid #f5c6cb'
    },
    accessDenied: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#666'
    },
    accessDeniedH2: {
      color: '#dc3545',
      marginBottom: '15px'
    },
    managementHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    managementH2: {
      color: '#333',
      marginBottom: '20px'
    },
    btnPrimary: {
      background: '#007bff',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background-color 0.3s ease'
    },
    filters: {
      display: 'flex',
      gap: '15px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    },
    searchInput: {
      flex: '1',
      minWidth: '200px',
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px'
    },
    filterSelect: {
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      background: 'white',
      minWidth: '120px'
    },
    tableContainer: {
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    tableTh: {
      background: '#f8f9fa',
      padding: '15px',
      textAlign: 'left',
      fontWeight: '600',
      color: '#333',
      borderBottom: '1px solid #e0e0e0'
    },
    tableTd: {
      padding: '15px',
      borderBottom: '1px solid #f0f0f0'
    },
    tableTr: {
      '&:hover': {
        background: '#f8f9fa'
      }
    },
    statusBadge: {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      textTransform: 'capitalize'
    },
    statusBadgeActive: {
      background: '#d4edda',
      color: '#155724'
    },
    statusBadgeLocked: {
      background: '#f8d7da',
      color: '#721c24'
    },
    actionButtons: {
      display: 'flex',
      gap: '5px'
    },
    btnSmall: {
      padding: '6px 12px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      transition: 'background-color 0.3s ease'
    },
    btnWarning: {
      background: '#ffc107',
      color: '#212529'
    },
    btnSuccess: {
      background: '#28a745',
      color: 'white'
    },
    btnDanger: {
      background: '#dc3545',
      color: 'white'
    },
    btnInfo: {
      background: '#17a2b8',
      color: 'white'
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '15px',
      padding: '20px',
      background: '#f8f9fa'
    },
    btnPagination: {
      padding: '8px 16px',
      border: '1px solid #ddd',
      background: 'white',
      cursor: 'pointer',
      borderRadius: '4px',
      transition: 'all 0.3s ease'
    },
    btnPaginationDisabled: {
      opacity: '0.5',
      cursor: 'not-allowed'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    },
    modalContent: {
      background: 'white',
      padding: '30px',
      borderRadius: '8px',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    modalH3: {
      marginTop: '0',
      marginBottom: '20px',
      color: '#333'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '20px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column'
    },
    formLabel: {
      marginBottom: '5px',
      fontWeight: '600',
      color: '#333',
      fontSize: '14px'
    },
    formInput: {
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px'
    },
    modalActions: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end',
      marginTop: '20px'
    },
    btnSecondary: {
      background: '#6c757d',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background-color 0.3s ease'
    },
    roleGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '15px'
    },
    roleCard: {
      background: 'white',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      textAlign: 'center'
    },
    recentList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    },
    recentItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px',
      background: '#f8f9fa',
      borderRadius: '4px'
    },
    userRole: {
      background: '#e9ecef',
      color: '#495057',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      marginLeft: '10px',
      textTransform: 'capitalize'
    },
    quickStats: {
      display: 'flex',
      gap: '20px',
      fontSize: '14px',
      color: '#666'
    },
    quickStatsSpan: {
      padding: '4px 8px',
      background: '#f8f9fa',
      borderRadius: '4px'
    },
    complaintSubject: {
      maxWidth: '300px'
    },
    complaintDescription: {
      fontSize: '12px',
      color: '#666',
      marginTop: '4px',
      fontStyle: 'italic'
    },
    priorityBadge: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'capitalize'
    },
    priorityLow: {
      background: '#e9ecef',
      color: '#495057'
    },
    priorityMedium: {
      background: '#fff3cd',
      color: '#856404'
    },
    priorityHigh: {
      background: '#f8d7da',
      color: '#721c24'
    },
    priorityUrgent: {
      background: '#f5c6cb',
      color: '#721c24',
      fontWeight: 'bold'
    },
    statusPending: {
      background: '#fff3cd',
      color: '#856404'
    },
    statusInProgress: {
      background: '#d1ecf1',
      color: '#0c5460'
    },
    statusResolved: {
      background: '#d4edda',
      color: '#155724'
    },
    statusClosed: {
      background: '#f8d7da',
      color: '#721c24'
    }
  };
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
      console.error('Error loading user stats:', err);
      setError('Failed to load user statistics');
    }
  };

  const loadCustomerStats = async () => {
    try {
      const response = await adminApi.getCustomerStats();
      setCustomerStats(response.data);
    } catch (err) {
      console.error('Error loading customer stats:', err);
      setError('Failed to load customer statistics');
    }
  };

  const loadComplaintStats = async () => {
    try {
      const response = await adminApi.getComplaintStats();
      setComplaintStats(response.data);
    } catch (err) {
      console.error('Error loading complaint stats:', err);
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
    <div style={styles.overview}>
      <h2 style={styles.overviewH2}>Dashboard Overview</h2>
      {userStats ? (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3 style={styles.statCardH3}>Total Users</h3>
            <p style={styles.statNumber}>{userStats.totalUsers || 0}</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statCardH3}>Active Users</h3>
            <p style={styles.statNumber}>{userStats.activeUsers || 0}</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statCardH3}>Locked Users</h3>
            <p style={styles.statNumber}>{userStats.lockedUsers || 0}</p>
          </div>
        </div>
      ) : (
        <div style={styles.loading}>Loading user statistics...</div>
      )}

      {customerStats ? (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3 style={styles.statCardH3}>Total Customers</h3>
            <p style={styles.statNumber}>{customerStats.totalCustomers || 0}</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statCardH3}>Active Customers</h3>
            <p style={styles.statNumber}>{customerStats.activeCustomers || 0}</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statCardH3}>Locked Customers</h3>
            <p style={styles.statNumber}>{customerStats.lockedCustomers || 0}</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statCardH3}>Total Reviews</h3>
            <p style={styles.statNumber}>{customerStats.totalReviews || 0}</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statCardH3}>Total Requests</h3>
            <p style={styles.statNumber}>{customerStats.totalRequests || 0}</p>
          </div>
        </div>
      ) : (
        <div style={styles.loading}>Loading customer statistics...</div>
      )}

      {complaintStats ? (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3 style={styles.statCardH3}>Total Complaints</h3>
            <p style={styles.statNumber}>{complaintStats.totalComplaints || 0}</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statCardH3}>Pending</h3>
            <p style={styles.statNumber}>{complaintStats.pendingComplaints || 0}</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statCardH3}>In Progress</h3>
            <p style={styles.statNumber}>{complaintStats.inProgressComplaints || 0}</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statCardH3}>Resolved</h3>
            <p style={styles.statNumber}>{complaintStats.resolvedComplaints || 0}</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statCardH3}>Closed</h3>
            <p style={styles.statNumber}>{complaintStats.closedComplaints || 0}</p>
          </div>
        </div>
      ) : (
        <div style={styles.loading}>Loading complaint statistics...</div>
      )}

      {userStats?.roleStats && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>Users by Role</h3>
          <div style={styles.roleGrid}>
            {userStats.roleStats.map(role => (
              <div key={role._id} style={styles.roleCard}>
                <h4 style={{ color: '#333', marginBottom: '5px', textTransform: 'capitalize' }}>
                  {role._id.charAt(0).toUpperCase() + role._id.slice(1)}
                </h4>
                <p style={{ color: '#666', margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                  {role.count} users
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {userStats?.recentUsers && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>Recent Users</h3>
          <div style={styles.recentList}>
            {userStats.recentUsers.map(user => (
              <div key={user._id} style={styles.recentItem}>
                <div>
                  <strong style={{ color: '#333' }}>{user.name}</strong>
                  <span style={styles.userRole}>{user.role}</span>
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

  const renderUserManagement = () => (
    <div>
      <div style={styles.managementHeader}>
        <h2 style={styles.managementH2}>User Management</h2>
        <button style={styles.btnPrimary} onClick={() => setShowAddUserModal(true)}>Add New User</button>
      </div>

      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search users..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          style={styles.searchInput}
        />
        <select
          value={filters.role}
          onChange={(e) => handleFilterChange('role', e.target.value)}
          style={styles.filterSelect}
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
          style={styles.filterSelect}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Locked</option>
        </select>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading users...</div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableTh}>Name</th>
                <th style={styles.tableTh}>Email</th>
                <th style={styles.tableTh}>Role</th>
                <th style={styles.tableTh}>Status</th>
                <th style={styles.tableTh}>Created</th>
                <th style={styles.tableTh}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} style={{ ...styles.tableTr, ':hover': { background: '#f8f9fa' } }}>
                  <td style={styles.tableTd}>{user.name}</td>
                  <td style={styles.tableTd}>{user.email}</td>
                  <td style={styles.tableTd}>
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateUserRole(user._id, e.target.value)}
                      style={styles.filterSelect}
                    >
                      <option value="customer">customer</option>
                      <option value="staff">staff</option>
                      <option value="manager">manager</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td style={styles.tableTd}>
                    <span style={{
                      ...styles.statusBadge,
                      ...(user.isActive ? styles.statusBadgeActive : styles.statusBadgeLocked)
                    }}>
                      {user.isActive ? 'Active' : 'Locked'}
                    </span>
                  </td>
                  <td style={styles.tableTd}>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td style={styles.tableTd}>
                    <div style={styles.actionButtons}>
                      <button
                        onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                        style={{
                          ...styles.btnSmall,
                          ...(user.isActive ? styles.btnWarning : styles.btnSuccess)
                        }}
                      >
                        {user.isActive ? 'Lock' : 'Unlock'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        style={{ ...styles.btnSmall, ...styles.btnDanger }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={styles.pagination}>
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev}
              style={{
                ...styles.btnPagination,
                ...(!pagination.hasPrev ? styles.btnPaginationDisabled : {})
              }}
            >
              Previous
            </button>
            <span>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
              style={{
                ...styles.btnPagination,
                ...(!pagination.hasNext ? styles.btnPaginationDisabled : {})
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderCustomerManagement = () => (
    <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={styles.managementHeader}>
        <h2 style={styles.managementH2}>Customer Management</h2>
        <div>
          {customerStats && (
            <div style={styles.quickStats}>
              <span style={styles.quickStatsSpan}>Total: {customerStats.totalCustomers}</span>
              <span style={styles.quickStatsSpan}>Active: {customerStats.activeCustomers}</span>
              <span style={styles.quickStatsSpan}>Locked: {customerStats.lockedCustomers}</span>
            </div>
          )}
        </div>
      </div>

      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search customers..."
          value={customerFilters.search}
          onChange={(e) => handleCustomerFilterChange('search', e.target.value)}
          style={styles.searchInput}
        />
        <select
          value={customerFilters.isActive}
          onChange={(e) => handleCustomerFilterChange('isActive', e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Locked</option>
        </select>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading customers...</div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableTh}>Name</th>
                <th style={styles.tableTh}>Email</th>
                <th style={styles.tableTh}>Phone</th>
                <th style={styles.tableTh}>Status</th>
                <th style={styles.tableTh}>Reviews</th>
                <th style={styles.tableTh}>Requests</th>
                <th style={styles.tableTh}>Created</th>
                <th style={styles.tableTh}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer._id}>
                  <td style={styles.tableTd}>{customer.name}</td>
                  <td style={styles.tableTd}>{customer.email}</td>
                  <td style={styles.tableTd}>{customer.phone || 'N/A'}</td>
                  <td style={styles.tableTd}>
                    <span style={{
                      ...styles.statusBadge,
                      ...(customer.isActive ? styles.statusBadgeActive : styles.statusBadgeLocked)
                    }}>
                      {customer.isActive ? 'Active' : 'Locked'}
                    </span>
                  </td>
                  <td style={styles.tableTd}>{customer.totalReviews || 0}</td>
                  <td style={styles.tableTd}>{customer.totalRequests || 0}</td>
                  <td style={styles.tableTd}>{new Date(customer.createdAt).toLocaleDateString()}</td>
                  <td style={styles.tableTd}>
                    <div style={styles.actionButtons}>
                      <button
                        onClick={() => {
                          const reason = prompt('Reason for status change (optional):');
                          handleToggleCustomerStatus(customer._id, customer.isActive, reason);
                        }}
                        style={{
                          ...styles.btnSmall,
                          ...(customer.isActive ? styles.btnWarning : styles.btnSuccess)
                        }}
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
                        style={{ ...styles.btnSmall, ...styles.btnInfo }}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={styles.pagination}>
            <button
              onClick={() => handleCustomerPageChange(customerPagination.currentPage - 1)}
              disabled={!customerPagination.hasPrev}
              style={{
                ...styles.btnPagination,
                ...(!customerPagination.hasPrev ? styles.btnPaginationDisabled : {})
              }}
            >
              Previous
            </button>
            <span>
              Page {customerPagination.currentPage} of {customerPagination.totalPages}
            </span>
            <button
              onClick={() => handleCustomerPageChange(customerPagination.currentPage + 1)}
              disabled={!customerPagination.hasNext}
              style={{
                ...styles.btnPagination,
                ...(!customerPagination.hasNext ? styles.btnPaginationDisabled : {})
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderComplaintManagement = () => {
    const getStatusStyle = (status) => {
      switch(status) {
        case 'pending': return styles.statusPending;
        case 'in_progress': return styles.statusInProgress;
        case 'resolved': return styles.statusResolved;
        case 'closed': return styles.statusClosed;
        default: return styles.statusBadge;
      }
    };
    
    const getPriorityStyle = (priority) => {
      switch(priority) {
        case 'low': return styles.priorityLow;
        case 'medium': return styles.priorityMedium;
        case 'high': return styles.priorityHigh;
        case 'urgent': return styles.priorityUrgent;
        default: return styles.priorityBadge;
      }
    };

    return (
      <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={styles.managementHeader}>
          <h2 style={styles.managementH2}>Complaint Management</h2>
          <div>
            {complaintStats && (
              <div style={styles.quickStats}>
                <span style={styles.quickStatsSpan}>Total: {complaintStats.totalComplaints}</span>
                <span style={styles.quickStatsSpan}>Pending: {complaintStats.pendingComplaints}</span>
                <span style={styles.quickStatsSpan}>Resolved: {complaintStats.resolvedComplaints}</span>
              </div>
            )}
          </div>
        </div>

        <div style={styles.filters}>
          <select
            value={complaintFilters.status}
            onChange={(e) => handleComplaintFilterChange('status', e.target.value)}
            style={styles.filterSelect}
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
            style={styles.filterSelect}
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
            style={styles.filterSelect}
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
          <div style={styles.loading}>Loading complaints...</div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableTh}>Customer</th>
                  <th style={styles.tableTh}>Subject</th>
                  <th style={styles.tableTh}>Status</th>
                  <th style={styles.tableTh}>Priority</th>
                  <th style={styles.tableTh}>Category</th>
                  <th style={styles.tableTh}>Created</th>
                  <th style={styles.tableTh}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(complaint => (
                  <tr key={complaint._id}>
                    <td style={styles.tableTd}>
                      <div>
                        <strong>{complaint.customerId?.name || complaint.customerName}</strong>
                        <br />
                        <small style={{ color: '#666' }}>{complaint.customerId?.email || complaint.customerEmail}</small>
                      </div>
                    </td>
                    <td style={styles.tableTd}>
                      <div style={styles.complaintSubject}>
                        {complaint.subject}
                        {complaint.description && (
                          <div style={styles.complaintDescription}>
                            {complaint.description.length > 100 
                              ? `${complaint.description.substring(0, 100)}...` 
                              : complaint.description
                            }
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={styles.tableTd}>
                      <span style={{ ...styles.statusBadge, ...getStatusStyle(complaint.status) }}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={styles.tableTd}>
                      <span style={{ ...styles.priorityBadge, ...getPriorityStyle(complaint.priority) }}>
                        {complaint.priority}
                      </span>
                    </td>
                    <td style={styles.tableTd}>{complaint.category.replace('_', ' ')}</td>
                    <td style={styles.tableTd}>{new Date(complaint.createdAt).toLocaleDateString()}</td>
                    <td style={styles.tableTd}>
                      <div style={styles.actionButtons}>
                        <button
                          onClick={() => {
                            const response = prompt('Enter your response:');
                            if (response) {
                              handleComplaintAction(complaint._id, 'respond', { response });
                            }
                          }}
                          style={{ ...styles.btnSmall, ...styles.btnInfo }}
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
                          style={{ ...styles.btnSmall, ...styles.btnSuccess }}
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Close this complaint?')) {
                              handleComplaintAction(complaint._id, 'close', {});
                            }
                          }}
                          style={{ ...styles.btnSmall, ...styles.btnWarning }}
                        >
                          Close
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={styles.pagination}>
              <button
                onClick={() => handleComplaintPageChange(complaintPagination.currentPage - 1)}
                disabled={!complaintPagination.hasPrev}
                style={{
                  ...styles.btnPagination,
                  ...(!complaintPagination.hasPrev ? styles.btnPaginationDisabled : {})
                }}
              >
                Previous
              </button>
              <span>
                Page {complaintPagination.currentPage} of {complaintPagination.totalPages}
              </span>
              <button
                onClick={() => handleComplaintPageChange(complaintPagination.currentPage + 1)}
                disabled={!complaintPagination.hasNext}
                style={{
                  ...styles.btnPagination,
                  ...(!complaintPagination.hasNext ? styles.btnPaginationDisabled : {})
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (user?.role !== 'admin') {
    return (
      <div style={styles.accessDenied}>
        <h2 style={styles.accessDeniedH2}>Access Denied</h2>
        <p>You don't have permission to access the admin dashboard.</p>
      </div>
    );
  }

  return (
    <div style={styles.dashboard}>
      <div style={styles.header}>
        <h1 style={styles.headerH1}>Admin Dashboard</h1>
        <p style={styles.headerP}>Welcome back, {user?.name}</p>
      </div>

      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tabButton,
            ...(activeTab === 'overview' ? styles.tabButtonActive : {})
          }}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          style={{
            ...styles.tabButton,
            ...(activeTab === 'users' ? styles.tabButtonActive : {})
          }}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button
          style={{
            ...styles.tabButton,
            ...(activeTab === 'customers' ? styles.tabButtonActive : {})
          }}
          onClick={() => setActiveTab('customers')}
        >
          Customer Management
        </button>
        <button
          style={{
            ...styles.tabButton,
            ...(activeTab === 'complaints' ? styles.tabButtonActive : {})
          }}
          onClick={() => setActiveTab('complaints')}
        >
          Complaint Management
        </button>
        <button
          style={{
            ...styles.tabButton,
            ...(activeTab === 'staff' ? styles.tabButtonActive : {})
          }}
          onClick={() => setActiveTab('staff')}
        >
          Staff Management
        </button>
        <button
          style={{
            ...styles.tabButton,
            ...(activeTab === 'settings' ? styles.tabButtonActive : {})
          }}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div style={styles.content}>
        {error && <div style={styles.errorMessage}>{error}</div>}
        
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUserManagement()}
        {activeTab === 'customers' && renderCustomerManagement()}
        {activeTab === 'complaints' && renderComplaintManagement()}
        {activeTab === 'staff' && (
          <div>
            <h2 style={styles.managementH2}>Staff Management</h2>
            <p>Staff management features coming soon...</p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div>
            <h2 style={styles.managementH2}>Admin Settings</h2>
            <p>Admin settings coming soon...</p>
          </div>
        )}
      </div>

      {showAddUserModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddUserModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalH3}>Add New User</h3>
            <form onSubmit={handleCreateUser} style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Phone</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  style={styles.formInput}
                >
                  <option value="customer">Customer</option>
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={styles.modalActions}>
                <button type="button" style={styles.btnSecondary} onClick={() => setShowAddUserModal(false)}>Cancel</button>
                <button type="submit" style={styles.btnPrimary} disabled={loading}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
