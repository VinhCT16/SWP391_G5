import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStaffTasks, updateTaskStatus } from '../api/taskApi';
import { updateProfile, changePassword } from '../api/userApi';
import BackButton from '../components/BackButton';
import './StaffDashboard.css';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusData, setStatusData] = useState({
    status: 'in-progress',
    notes: ''
  });
  const [filters, setFilters] = useState({
    status: '',
    taskType: '',
    priority: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  
  // Profile update states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load staff tasks
  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await getStaffTasks();
      setTasks(response.data.tasks || []);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Handle task status update
  const handleStatusUpdate = async () => {
    if (!selectedTask) return;

    try {
      setLoading(true);
      await updateTaskStatus(selectedTask.requestId, selectedTask.taskId, statusData);
      
      // Reload tasks
      await loadTasks();
      
      // Close modal and reset
      setShowStatusModal(false);
      setSelectedTask(null);
      setStatusData({
        status: 'in-progress',
        notes: ''
      });
      
      alert('Task status updated successfully!');
    } catch (err) {
      console.error('Error updating task status:', err);
      setError(err?.response?.data?.message || 'Failed to update task status');
    } finally {
      setLoading(false);
    }
  };

  // Open status update modal
  const openStatusModal = (task, newStatus) => {
    setSelectedTask(task);
    setStatusData({
      status: newStatus,
      notes: ''
    });
    setShowStatusModal(true);
  };

  // Open details modal
  const openDetailsModal = (task) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  };

  // Handle profile update
  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      const response = await updateProfile(profileData);
      
      // Update user context if available
      if (response.data.user) {
        // You might want to update the user context here
        // This depends on how your AuthContext is implemented
      }
      
      setShowProfileModal(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      alert('Password changed successfully!');
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // Open profile modal
  const openProfileModal = () => {
    setProfileData({
      name: user?.name || '',
      phone: user?.phone || ''
    });
    setShowProfileModal(true);
  };

  // Open password modal
  const openPasswordModal = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordModal(true);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = !filters.status || task.status === filters.status;
    const matchesType = !filters.taskType || task.taskType === filters.taskType;
    const matchesPriority = !filters.priority || (task.priority && task.priority === filters.priority);
    const searchText = filters.search.trim().toLowerCase();
    const matchesSearch = !searchText || [
      task.requestNumber,
      task.customer?.name,
      task.customer?.email,
      task.customer?.phone,
      task.taskType
    ].some(v => (v || '').toString().toLowerCase().includes(searchText));

    // Date filtering by move date if present, else by createdAt
    const taskDateStr = task?.moveDetails?.moveDate || task?.createdAt;
    const taskDate = taskDateStr ? new Date(taskDateStr) : null;
    const fromOk = !filters.dateFrom || (taskDate && taskDate >= new Date(filters.dateFrom));
    const toOk = !filters.dateTo || (taskDate && taskDate <= new Date(filters.dateTo + 'T23:59:59'));

    return matchesStatus && matchesType && matchesPriority && matchesSearch && fromOk && toOk;
  });

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);

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

  const getTaskTypeIcon = (taskType) => {
    switch (taskType) {
      case 'packing': return '📦';
      case 'loading': return '⬆️';
      case 'transporting': return '🚚';
      case 'unloading': return '⬇️';
      case 'unpacking': return '📋';
      default: return '📝';
    }
  };

  return (
    <div className="staff-dashboard">
      <BackButton fallbackPath="/dashboard" />
      
      <header className="home-header">
        <div className="header-content">
          <div className="logo">
            <h1>Staff Dashboard</h1>
            <span>Manage your assigned tasks</span>
          </div>
          <div className="user-info">
            <span>Welcome, {user?.name}</span>
          </div>
        </div>
      </header>

      <nav className="home-nav" style={{ background: 'linear-gradient(90deg, #e3ffe8 0%, #eaf6ff 100%)', borderRadius: '12px', padding: '0.5rem 0.5rem 0.5rem 0.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <button
          className={activeTab === 'my-tasks' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('my-tasks')}
          style={{
            background: activeTab === 'my-tasks' ? 'linear-gradient(90deg, #4caf50 60%, #81c784 100%)' : 'white',
            color: activeTab === 'my-tasks' ? '#fff' : '#333',
            border: activeTab === 'my-tasks' ? 'none' : '1px solid #e0e0e0',
            marginRight: '0.5rem',
            fontWeight: 600,
            boxShadow: activeTab === 'my-tasks' ? '0 2px 8px rgba(76,175,80,0.10)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <span role="img" aria-label="tasks" style={{ marginRight: 6 }}>📋</span>
          My Tasks
        </button>
        <button
          className={activeTab === 'history' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('history')}
          style={{
            background: activeTab === 'history' ? 'linear-gradient(90deg, #2196f3 60%, #90caf9 100%)' : 'white',
            color: activeTab === 'history' ? '#fff' : '#333',
            border: activeTab === 'history' ? 'none' : '1px solid #e0e0e0',
            marginRight: '0.5rem',
            fontWeight: 600,
            boxShadow: activeTab === 'history' ? '0 2px 8px rgba(33,150,243,0.10)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <span role="img" aria-label="history" style={{ marginRight: 6 }}>🕘</span>
          History
        </button>
        <button
          className={activeTab === 'profile' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('profile')}
          style={{
            background: activeTab === 'profile' ? 'linear-gradient(90deg, #ff9800 60%, #ffe0b2 100%)' : 'white',
            color: activeTab === 'profile' ? '#fff' : '#333',
            border: activeTab === 'profile' ? 'none' : '1px solid #e0e0e0',
            fontWeight: 600,
            boxShadow: activeTab === 'profile' ? '0 2px 8px rgba(255,152,0,0.10)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <span role="img" aria-label="profile" style={{ marginRight: 6 }}>👤</span>
          Profile
        </button>
      </nav>

      <main className="home-main">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <div className="welcome-section">
              <h2>Welcome back, {user?.name}!</h2>
              <p>Track your progress and manage tasks efficiently</p>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>{tasks.filter(t => t.status === 'completed').length}</h3>
                <p>Completed Tasks</p>
              </div>
              <div className="stat-card">
                <h3>{tasks.filter(t => ['pending', 'assigned', 'in-progress', 'blocked'].includes(t.status)).length}</h3>
                <p>Active Tasks</p>
              </div>
              <div className="stat-card">
                <h3>{tasks.length}</h3>
                <p>Total Tasks</p>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button className="action-btn primary" onClick={() => setActiveTab('my-tasks')}>
                  📋 View My Tasks
                </button>
                <button className="action-btn secondary" onClick={loadTasks} disabled={loading}>
                  🔄 Refresh Tasks
                </button>
                <button className="action-btn tertiary" onClick={() => setActiveTab('history')}>
                  🕘 View History
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'my-tasks' && (
          <div className="dashboard-main">
            <div className="dashboard-header-section">
              <h2>My Tasks</h2>
              <div className="dashboard-actions">
                <button 
                  className="refresh-btn"
                  onClick={loadTasks}
                  disabled={loading}
                >
                  🔄 Refresh
                </button>
                <button 
                  className="filter-btn"
                  onClick={() => setFilters({status: '', taskType: '', priority: '', search: '', dateFrom: '', dateTo: ''})}
                >
                  🗂️ Clear Filters
                </button>
              </div>
              <div className="filters">
                <input
                  type="text"
                  placeholder="Search by customer, email, phone, request..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="filter-input"
                />
                <select 
                  value={filters.status} 
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="filter-select"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select 
                  value={filters.taskType} 
                  onChange={(e) => setFilters({...filters, taskType: e.target.value})}
                  className="filter-select"
                >
                  <option value="">All Types</option>
                  <option value="packing">Packing</option>
                  <option value="loading">Loading</option>
                  <option value="transporting">Transporting</option>
                  <option value="unloading">Unloading</option>
                  <option value="unpacking">Unpacking</option>
                </select>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({...filters, priority: e.target.value})}
                  className="filter-select"
                >
                  <option value="">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  className="filter-input"
                />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  className="filter-input"
                />
                <button onClick={loadTasks} className="refresh-btn">Refresh</button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {loading ? (
              <div className="loading-state">
                <p>Loading tasks...</p>
              </div>
            ) : (
              <div className="tasks-grid">
                {filteredTasks.map((task) => (
                  <div key={task.taskId} className="task-card">
                    <div className="task-header">
                      <div className="task-title">
                        <span className="task-icon">{getTaskTypeIcon(task.taskType)}</span>
                        <h3>{task.taskType.charAt(0).toUpperCase() + task.taskType.slice(1)}</h3>
                      </div>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(task.status) }}
                      >
                        {task.status.replace('-', ' ')}
                      </span>
                    </div>
                    
                    <div className="task-details">
                      <div className="detail-row">
                        <strong>Request #:</strong> {task.requestNumber}
                      </div>
                      <div className="detail-row">
                        <strong>Customer:</strong> {task.customer?.name}
                      </div>
                      <div className="detail-row">
                        <strong>Email:</strong> {task.customer?.email}
                      </div>
                      <div className="detail-row">
                        <strong>Phone:</strong> {task.customer?.phone}
                      </div>
                      <div className="detail-row">
                        <strong>From:</strong> {task.moveDetails?.fromAddress}
                      </div>
                      <div className="detail-row">
                        <strong>To:</strong> {task.moveDetails?.toAddress}
                      </div>
                      <div className="detail-row">
                        <strong>Move Date:</strong> {new Date(task.moveDetails?.moveDate).toLocaleDateString()}
                      </div>
                      <div className="detail-row">
                        <strong>Duration:</strong> {task.estimatedDuration} hours
                      </div>
                      {task.isTransporter && (
                        <div className="detail-row">
                          <strong>Role:</strong> <span className="role-badge">Transporter</span>
                        </div>
                      )}
                    </div>

                    <div className="task-actions">
                      {task.status === 'pending' && (
                        <button 
                          className="start-btn"
                          onClick={() => openStatusModal(task, 'in-progress')}
                        >
                          Start Task
                        </button>
                      )}
                      {task.status === 'assigned' && (
                        <button 
                          className="start-btn"
                          onClick={() => openStatusModal(task, 'in-progress')}
                        >
                          Start Task
                        </button>
                      )}
                      {task.status === 'in-progress' && (
                        <button 
                          className="complete-btn"
                          onClick={() => openStatusModal(task, 'completed')}
                        >
                          Done
                        </button>
                      )}
                      {(task.status !== 'completed' && task.status !== 'cancelled') && (
                        <button
                          className="block-btn"
                          onClick={() => openStatusModal(task, 'blocked')}
                        >
                          Blocked
                        </button>
                      )}
                      <button 
                        className="view-btn"
                        onClick={() => openDetailsModal(task)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredTasks.length === 0 && !loading && (
              <div className="empty-state">
                <h3>No tasks found</h3>
                <p>No tasks match your current filters or you have no assigned tasks.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <section className="dashboard-stats">
            <h3>My Performance</h3>
            <div className="stats-grid">
              <div className="stat-card"><span>Total</span><strong>{tasks.length}</strong></div>
              <div className="stat-card"><span>In Progress</span><strong>{tasks.filter(t => t.status === 'in-progress').length}</strong></div>
              <div className="stat-card"><span>Blocked</span><strong>{tasks.filter(t => t.status === 'blocked').length}</strong></div>
              <div className="stat-card"><span>Completed</span><strong>{tasks.filter(t => t.status === 'completed').length}</strong></div>
            </div>
            <div className="history-list">
              <h4>Recent Tasks</h4>
              {tasks.slice(0, 10).map(t => (
                <div key={`${t.taskId}-history`} className="history-item">
                  <span>#{t.requestNumber} • {t.taskType}</span>
                  <span className="status-badge" style={{ backgroundColor: getStatusColor(t.status) }}>{t.status.replace('-', ' ')}</span>
                </div>
              ))}
            </div>
          </section>
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
                <button className="action-btn secondary" onClick={openProfileModal}>Update Profile</button>
                <button className="action-btn secondary" onClick={openPasswordModal}>Change Password</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Update Task Status</h3>
            
            <div className="modal-body">
              <p>
                <strong>Task:</strong> {selectedTask?.taskType?.charAt(0).toUpperCase() + selectedTask?.taskType?.slice(1)}
              </p>
              <p>
                <strong>Request #:</strong> {selectedTask?.requestNumber}
              </p>
              <p>
                <strong>Customer:</strong> {selectedTask?.customer?.name}
              </p>
              
              <div className="form-group">
                <label>Status:</label>
                <select
                  value={statusData.status}
                  onChange={(e) => setStatusData({...statusData, status: e.target.value})}
                >
                  <option value="in-progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Notes (Optional):</label>
                <textarea
                  value={statusData.notes}
                  onChange={(e) => setStatusData({...statusData, notes: e.target.value})}
                  placeholder="Add any notes about this task..."
                  rows="3"
                />
              </div>
              {/* Placeholder for attachments - requires backend endpoint */}
              <div className="form-group">
                <label>Attachments (Optional):</label>
                <input type="file" multiple disabled title="File upload not supported yet" />
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </button>
              <button 
                className="update-btn"
                onClick={handleStatusUpdate}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {showDetailsModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Task Details</h3>
            <div className="modal-body">
              <p><strong>Task Type:</strong> {selectedTask?.taskType}</p>
              <p><strong>Request #:</strong> {selectedTask?.requestNumber}</p>
              <p><strong>Status:</strong> {selectedTask?.status}</p>
              <p><strong>Priority:</strong> {selectedTask?.priority || 'N/A'}</p>
              <p><strong>Description:</strong> {selectedTask?.description || 'No description provided.'}</p>
              <p><strong>Deadline:</strong> {selectedTask?.deadline ? new Date(selectedTask.deadline).toLocaleString() : 'N/A'}</p>
              <p><strong>Manager Notes:</strong> {selectedTask?.managerNotes || '—'}</p>
              <p><strong>Customer Notes:</strong> {selectedTask?.customerNotes || '—'}</p>
              <div className="detail-row">
                <strong>From:</strong> {selectedTask?.moveDetails?.fromAddress}
              </div>
              <div className="detail-row">
                <strong>To:</strong> {selectedTask?.moveDetails?.toAddress}
              </div>
              <div className="detail-row">
                <strong>Move Date:</strong> {selectedTask?.moveDetails?.moveDate ? new Date(selectedTask.moveDetails.moveDate).toLocaleDateString() : 'N/A'}
              </div>
              {Array.isArray(selectedTask?.attachments) && selectedTask.attachments.length > 0 && (
                <div className="attachments">
                  <strong>Attachments:</strong>
                  <ul>
                    {selectedTask.attachments.map((att, idx) => (
                      <li key={idx}><a href={att.url} target="_blank" rel="noreferrer">{att.name || `Attachment ${idx+1}`}</a></li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="links">
                <a href={`/requests/${selectedTask?.requestId}`} className="link-btn">View Request</a>
                {selectedTask?.contractId && (
                  <a href={`/contracts/${selectedTask.contractId}`} className="link-btn">View Contract</a>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDetailsModal(false)}>Close</button>
              {(selectedTask?.status === 'pending' || selectedTask?.status === 'assigned') && (
                <button className="start-btn" onClick={() => { setShowDetailsModal(false); openStatusModal(selectedTask, 'in-progress'); }}>Start</button>
              )}
              {selectedTask?.status === 'in-progress' && (
                <button className="complete-btn" onClick={() => { setShowDetailsModal(false); openStatusModal(selectedTask, 'completed'); }}>Done</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Update Modal */}
      {showProfileModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Update Profile</h3>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Phone:</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  style={{ backgroundColor: '#f5f5f5', color: '#666' }}
                />
                <small style={{ color: '#666' }}>Email cannot be changed</small>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowProfileModal(false)}
              >
                Cancel
              </button>
              <button 
                className="update-btn"
                onClick={handleProfileUpdate}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Change Password</h3>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Current Password:</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>New Password:</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  required
                  minLength="6"
                />
                <small style={{ color: '#666' }}>Minimum 6 characters</small>
              </div>
              
              <div className="form-group">
                <label>Confirm New Password:</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </button>
              <button 
                className="update-btn"
                onClick={handlePasswordChange}
                disabled={loading}
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
