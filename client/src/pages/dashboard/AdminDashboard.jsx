import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import adminApi from '../../api/adminApi';
import AdminDashboardTabs from './admin/AdminDashboardTabs';
import AddUserModal from '../../components/dashboard/AddUserModal';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerComplaints, setCustomerComplaints] = useState([]);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);

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
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        url: err.config?.url,
        message: err.message
      });
      // Don't set error for stats, just log it - stats are not critical
      // setError('Failed to load customer statistics');
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

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (activeTab === 'customers') {
      loadCustomers();
    }
  }, [loadCustomers, activeTab]);

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

  const handleCreateUser = async (newUser) => {
    try {
      setLoading(true);
      await adminApi.createUser(newUser);
      setShowAddUserModal(false);
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

  const handleViewUserDetails = async (userId) => {
    try {
      setLoading(true);
      const response = await adminApi.getUserById(userId);
      setSelectedUser(response.data);
      setShowUserDetails(true);
    } catch (err) {
      setError('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Enter new password (min 6 characters):');
    if (newPassword && newPassword.length >= 6) {
      try {
        setLoading(true);
        await adminApi.resetUserPassword(userId, newPassword);
        alert('Password reset successfully');
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to reset password');
      } finally {
        setLoading(false);
      }
    } else if (newPassword) {
      alert('Password must be at least 6 characters long');
    }
  };

  const handleViewCustomerDetails = async (customerId) => {
    try {
      setLoading(true);
      const response = await adminApi.getCustomerById(customerId);
      setSelectedCustomer(response.data);
      setShowCustomerDetails(true);
    } catch (err) {
      setError('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCustomerComplaints = async (customerId) => {
    try {
      setLoading(true);
      const response = await adminApi.getCustomerComplaints(customerId);
      setCustomerComplaints(response.data.complaints);
      setSelectedCustomer({ _id: customerId });
      setShowCustomerDetails(true);
    } catch (err) {
      setError('Failed to load customer complaints');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="admin-dashboard">
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
          <h2 style={{ color: '#dc3545', marginBottom: '15px' }}>Access Denied</h2>
          <p>You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {user?.name}</p>
        </div>
        <button 
          onClick={async () => {
            try {
              await logout();
              navigate('/login');
            } catch (err) {
              console.error('Logout failed:', err);
            }
          }}
          style={{
            padding: '8px 16px',
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#333',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#f8f9fa';
            e.target.style.borderColor = '#007bff';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#fff';
            e.target.style.borderColor = '#ddd';
          }}
        >
          Logout
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === 'overview' ? 'admin-tab-btn active' : 'admin-tab-btn'}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'users' ? 'admin-tab-btn active' : 'admin-tab-btn'}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button
          className={activeTab === 'customers' ? 'admin-tab-btn active' : 'admin-tab-btn'}
          onClick={() => setActiveTab('customers')}
        >
          Customer Management
        </button>
        <button
          className={activeTab === 'complaints' ? 'admin-tab-btn active' : 'admin-tab-btn'}
          onClick={() => setActiveTab('complaints')}
        >
          Complaint Management
        </button>
        <button
          className={activeTab === 'staff' ? 'admin-tab-btn active' : 'admin-tab-btn'}
          onClick={() => setActiveTab('staff')}
        >
          Staff Management
        </button>
        <button
          className={activeTab === 'settings' ? 'admin-tab-btn active' : 'admin-tab-btn'}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div style={{ minHeight: '400px' }}>
        {error && <div className="error-message">{error}</div>}
        
        <AdminDashboardTabs
          activeTab={activeTab}
          userStats={userStats}
          customerStats={customerStats}
          complaintStats={complaintStats}
          users={users}
          customers={customers}
          complaints={complaints}
          loading={loading}
          filters={filters}
          customerFilters={customerFilters}
          complaintFilters={complaintFilters}
          pagination={pagination}
          customerPagination={customerPagination}
          complaintPagination={complaintPagination}
          onFilterChange={handleFilterChange}
          onCustomerFilterChange={handleCustomerFilterChange}
          onComplaintFilterChange={handleComplaintFilterChange}
          onPageChange={handlePageChange}
          onCustomerPageChange={handleCustomerPageChange}
          onComplaintPageChange={handleComplaintPageChange}
          onUpdateRole={handleUpdateUserRole}
          onToggleStatus={handleToggleUserStatus}
          onDelete={handleDeleteUser}
          onToggleCustomerStatus={handleToggleCustomerStatus}
          onUpdateCustomer={handleUpdateCustomer}
          onAction={handleComplaintAction}
          onAddUser={() => setShowAddUserModal(true)}
          onViewUserDetails={handleViewUserDetails}
          onResetPassword={handleResetPassword}
          onViewCustomerDetails={handleViewCustomerDetails}
          onViewCustomerComplaints={handleViewCustomerComplaints}
          selectedUser={selectedUser}
          selectedCustomer={selectedCustomer}
          customerComplaints={customerComplaints}
          showUserDetails={showUserDetails}
          showCustomerDetails={showCustomerDetails}
          onCloseUserDetails={() => {
            setShowUserDetails(false);
            setSelectedUser(null);
          }}
          onCloseCustomerDetails={() => {
            setShowCustomerDetails(false);
            setSelectedCustomer(null);
            setCustomerComplaints([]);
          }}
        />
      </div>

      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSubmit={handleCreateUser}
        loading={loading}
      />
    </div>
  );
};

export default AdminDashboard;
