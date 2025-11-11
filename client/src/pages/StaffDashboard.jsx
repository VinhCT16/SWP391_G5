// client/src/pages/StaffDashboard.jsx - Dashboard cho nhân viên
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStaffTasks as getStaffTasksFromTaskApi, updateTaskStatus } from '../api/taskApi';
import { getStaffTasks as getStaffTasksFromRequestApi } from '../api/requestApi';
import { updateProfile, changePassword } from '../api/userApi';
import { fmtDateTime24 } from '../utils/datetime';
import { fmtAddress } from '../utils/address';
import BackButton from '../components/BackButton';
import '../styles/movingService.css';
import './StaffDashboard.css';

// Status configuration for request-based view
const STATUS_CONFIG = {
  UNDER_SURVEY: {
    label: "Đang khảo sát",
    color: "#2196f3",
    bg: "#e3f2fd",
    description: "Cần khảo sát nhà và nhập đồ dùng",
  },
  WAITING_PAYMENT: {
    label: "Chờ thanh toán",
    color: "#9c27b0",
    bg: "#f3e5f5",
    description: "Đã báo giá, chờ khách thanh toán",
  },
  IN_PROGRESS: {
    label: "Đang vận chuyển",
    color: "#00bcd4",
    bg: "#e0f7fa",
    description: "Đang thực hiện vận chuyển",
  },
  DONE: {
    label: "Đã hoàn thành",
    color: "#4caf50",
    bg: "#e8f5e9",
    description: "Đã hoàn thành dịch vụ",
  },
};

const getStatusConfig = (status) => {
  return STATUS_CONFIG[status] || {
    label: status || "Không xác định",
    color: "#757575",
    bg: "#fafafa",
    description: "",
  };
};

export default function StaffDashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  
  // Tab management
  const [activeTab, setActiveTab] = useState('my-tasks');
  
  // Task/Request data
  const [tasks, setTasks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Task selection and modals
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusData, setStatusData] = useState({
    status: 'in-progress',
    notes: ''
  });
  
  // Request filtering (for request-based view)
  const [filterStatus, setFilterStatus] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  
  // Task filtering (for task-based view)
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

  // Load staff tasks (task-based API)
  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getStaffTasksFromTaskApi();
      setTasks(response.data?.tasks || []);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Load staff requests (request-based API)
  const loadRequests = async () => {
    setLoading(true);
    try {
      console.log("🔄 Đang load staff tasks...");
      const data = await getStaffTasksFromRequestApi();
      console.log("✅ Nhận được data:", data);
      console.log("📊 Số lượng requests:", Array.isArray(data) ? data.length : 0);
      if (Array.isArray(data) && data.length > 0) {
        console.log("📋 Status của requests:", data.map(r => ({ id: r._id?.slice(-8), status: r.status })));
      }
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error loading staff tasks:", err);
      console.error("Error details:", err.message, err.stack);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (activeTab === 'my-tasks') {
      loadTasks();
    } else if (activeTab === 'requests') {
      loadRequests();
    }
  }, [activeTab]);

  // Filter requests
  const filteredRequests = filterStatus
    ? requests.filter((r) => r.status === filterStatus)
    : requests;

  // Sort requests: newest first
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.requestDate || 0);
    const dateB = new Date(b.createdAt || b.requestDate || 0);
    return dateB - dateA;
  });

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

  // Statistics for requests
  const requestStats = {
    survey: requests.filter((r) => r.status === "UNDER_SURVEY").length,
    waiting: requests.filter((r) => r.status === "WAITING_PAYMENT").length,
    inProgress: requests.filter((r) => r.status === "IN_PROGRESS").length,
    done: requests.filter((r) => r.status === "DONE").length,
  };

  // Helper functions
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

  // Event handlers
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

  const openStatusModal = (task, newStatus) => {
    setSelectedTask(task);
    setStatusData({
      status: newStatus,
      notes: ''
    });
    setShowStatusModal(true);
  };

  const openDetailsModal = (task) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  };

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      const response = await updateProfile(profileData);
      
      // Update user context if available
      if (response.data?.user) {
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

  const openProfileModal = () => {
    setProfileData({
      name: user?.name || '',
      phone: user?.phone || ''
    });
    setShowProfileModal(true);
  };

  const openPasswordModal = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordModal(true);
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
          className={activeTab === 'requests' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('requests')}
          style={{
            background: activeTab === 'requests' ? 'linear-gradient(90deg, #2196f3 60%, #90caf9 100%)' : 'white',
            color: activeTab === 'requests' ? '#fff' : '#333',
            border: activeTab === 'requests' ? 'none' : '1px solid #e0e0e0',
            marginRight: '0.5rem',
            fontWeight: 600,
            boxShadow: activeTab === 'requests' ? '0 2px 8px rgba(33,150,243,0.10)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <span role="img" aria-label="requests" style={{ marginRight: 6 }}>📝</span>
          Requests
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
        {/* My Tasks Tab */}
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
                        <h3>{task.taskType?.charAt(0).toUpperCase() + task.taskType?.slice(1)}</h3>
                      </div>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(task.status) }}
                      >
                        {task.status?.replace('-', ' ')}
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
                        <strong>Move Date:</strong> {task.moveDetails?.moveDate ? new Date(task.moveDetails.moveDate).toLocaleDateString() : 'N/A'}
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

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="moving-service-container">
            <div className="content-wrapper">
              <div className="page-header">
                <h1>Staff Dashboard - Quản Lý Công Việc</h1>
                <p>Xem và quản lý các công việc được phân công</p>
              </div>

              {/* Stats Cards */}
              <div className="main-card">
                <h2 style={{ marginTop: 0, marginBottom: "1rem", color: "#2c3e50" }}>Thống kê công việc</h2>
                <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                  <div className="stat-card" style={{ background: "linear-gradient(135deg, #2196f3 0%, #2196f3dd 100%)" }}>
                    <h3 style={{ color: "white", margin: 0 }}>{requestStats.survey}</h3>
                    <p style={{ color: "white", opacity: 0.9, margin: 0 }}>Cần khảo sát</p>
                  </div>
                  <div className="stat-card" style={{ background: "linear-gradient(135deg, #9c27b0 0%, #9c27b0dd 100%)" }}>
                    <h3 style={{ color: "white", margin: 0 }}>{requestStats.waiting}</h3>
                    <p style={{ color: "white", opacity: 0.9, margin: 0 }}>Chờ thanh toán</p>
                  </div>
                  <div className="stat-card" style={{ background: "linear-gradient(135deg, #00bcd4 0%, #00bcd4dd 100%)" }}>
                    <h3 style={{ color: "white", margin: 0 }}>{requestStats.inProgress}</h3>
                    <p style={{ color: "white", opacity: 0.9, margin: 0 }}>Đang vận chuyển</p>
                  </div>
                  <div className="stat-card" style={{ background: "linear-gradient(135deg, #4caf50 0%, #4caf50dd 100%)" }}>
                    <h3 style={{ color: "white", margin: 0 }}>{requestStats.done}</h3>
                    <p style={{ color: "white", opacity: 0.9, margin: 0 }}>Đã hoàn thành</p>
                  </div>
                </div>
              </div>

              {/* Tasks List */}
              <div className="main-card">
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1rem" }}>
                    <input
                      placeholder="Tìm kiếm theo số điện thoại..."
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                      className="form-group input-primary"
                      style={{ flex: 1, minWidth: "250px", maxWidth: "400px" }}
                    />
                    <button onClick={loadRequests} className="btn btn-primary">
                      Làm mới
                    </button>
                  </div>

                  {/* Filter buttons */}
                  {requests.length > 0 && (
                    <div className="filter-buttons">
                      <button
                        onClick={() => setFilterStatus("")}
                        className={`filter-btn ${filterStatus === "" ? "active" : ""}`}
                      >
                        Tất cả ({requests.length})
                      </button>
                      {Object.keys(STATUS_CONFIG).map((key) => {
                        const count = requests.filter((r) => r.status === key).length;
                        if (count === 0) return null;
                        return (
                          <button
                            key={key}
                            onClick={() => setFilterStatus(filterStatus === key ? "" : key)}
                            className={`filter-btn ${filterStatus === key ? "active" : ""}`}
                            style={{
                              borderColor: STATUS_CONFIG[key].color,
                            }}
                          >
                            {STATUS_CONFIG[key].label} ({count})
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="loading-state">
                    <div className="loading-spinner" />
                    <p>Đang tải...</p>
                  </div>
                ) : sortedRequests.length === 0 ? (
                  <div className="empty-state">
                    <h3>Chưa có công việc nào</h3>
                    <p>
                      {requests.length === 0
                        ? "Bạn chưa được phân công công việc nào. Vui lòng liên hệ manager."
                        : `Không có công việc nào với trạng thái "${filterStatus ? getStatusConfig(filterStatus).label : ""}"`}
                    </p>
                  </div>
                ) : (
                  <div className="moves-list">
                    {sortedRequests
                      .filter((r) => !searchPhone || r.customerPhone?.includes(searchPhone))
                      .map((r) => {
                        const statusConfig = getStatusConfig(r.status);
                        const shortId = r._id?.slice(-8) || "N/A";
                        const statusKey = r.status?.toLowerCase().replace("_", "-") || "unknown";
                        return (
                          <div key={r._id} className="move-card">
                            <div className="move-header">
                              <h3>Request #{shortId}</h3>
                              <span
                                className={`status-badge ${statusKey}`}
                                style={{
                                  backgroundColor: statusConfig.bg,
                                  color: statusConfig.color,
                                }}
                                title={statusConfig.description}
                              >
                                {statusConfig.label}
                              </span>
                            </div>
                            <div className="move-details">
                              <p>
                                <strong>Khách hàng:</strong> {r.customerName}
                              </p>
                              <p>
                                <strong>SĐT:</strong> {r.customerPhone}
                              </p>
                              <p>
                                <strong>Lấy hàng:</strong> {fmtAddress(r.pickupAddress || r.address)}
                              </p>
                              <p>
                                <strong>Giao hàng:</strong> {fmtAddress(r.deliveryAddress || r.address)}
                              </p>
                              <p>
                                <strong>Thời gian chuyển:</strong> {fmtDateTime24(r.movingTime)}
                              </p>
                              {r.surveyFee && (
                                <p>
                                  <strong>Phí khảo sát:</strong> {r.surveyFee.toLocaleString()}₫
                                </p>
                              )}
                            </div>
                            <div className="move-actions">
                              {r.status === "UNDER_SURVEY" && (
                                <button
                                  onClick={() => nav(`/staff/survey/${r._id}`)}
                                  className="btn btn-primary"
                                >
                                  Khảo sát & Nhập đồ dùng
                                </button>
                              )}
                              {r.status === "IN_PROGRESS" && (
                                <button
                                  onClick={() => nav(`/staff/task/${r._id}`)}
                                  className="btn btn-primary"
                                >
                                  Xem chi tiết & Cập nhật
                                </button>
                              )}
                              <button
                                onClick={() => nav(`/requests/${r._id}/detail`)}
                                className="btn btn-secondary"
                              >
                                Xem chi tiết
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
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
                  <span className="status-badge" style={{ backgroundColor: getStatusColor(t.status) }}>{t.status?.replace('-', ' ')}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Profile Tab */}
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
