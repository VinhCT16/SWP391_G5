import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStaffTasks as getStaffTasksFromTaskApi, updateTaskStatus } from '../../api/taskApi';
import { getStaffTasks as getStaffTasksFromRequestApi } from '../../api/requestApi';
import StaffDashboardTabs from './staff/StaffDashboardTabs';
import ProfileModal from '../../components/dashboard/ProfileModal';
import PasswordModal from '../../components/dashboard/PasswordModal';
import TaskStatusModal from '../../components/dashboard/TaskStatusModal';
import TaskDetailsModal from '../../components/dashboard/TaskDetailsModal';
import '../../styles/movingService.css';
import './StaffDashboard.css';

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('my-tasks');
  const [tasks, setTasks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getStaffTasksFromRequestApi();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading staff tasks:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my-tasks') {
      loadTasks();
    } else if (activeTab === 'requests') {
      loadRequests();
    }
  }, [activeTab]);

  const handleStatusUpdate = async (requestId, taskId, statusData) => {
    try {
      setLoading(true);
      await updateTaskStatus(requestId, taskId, statusData);
      await loadTasks();
      alert('Task status updated successfully!');
    } catch (err) {
      console.error('Error updating task status:', err);
      setError(err?.response?.data?.message || 'Failed to update task status');
    } finally {
      setLoading(false);
    }
  };

  const openStatusModal = (task, newStatus) => {
    setSelectedTask({ ...task, status: newStatus });
    setShowStatusModal(true);
  };

  const openDetailsModal = (task) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  };

  const handleProfileSuccess = () => {
    loadTasks();
    loadRequests();
  };

  return (
    <div className="staff-dashboard">
      <header className="home-header">
        <div className="header-content">
          <div className="logo">
            <h1>Staff Dashboard</h1>
            <span>Manage your assigned tasks</span>
          </div>
          <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span>Welcome, {user?.name}</span>
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
        {error && <div className="error-message">{error}</div>}
        <StaffDashboardTabs
          activeTab={activeTab}
          tasks={tasks}
          requests={requests}
          loading={loading}
          error={error}
          onRefresh={activeTab === 'my-tasks' ? loadTasks : loadRequests}
          onUpdateStatus={openStatusModal}
          onViewDetails={openDetailsModal}
          user={user}
          onOpenProfileModal={() => setShowProfileModal(true)}
          onOpenPasswordModal={() => setShowPasswordModal(true)}
        />
      </main>

      <TaskStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        task={selectedTask}
        onUpdate={handleStatusUpdate}
        loading={loading}
      />

      <TaskDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        task={selectedTask}
        onStart={(task) => openStatusModal(task, 'in-progress')}
        onComplete={(task) => openStatusModal(task, 'completed')}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onSuccess={handleProfileSuccess}
      />

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handleProfileSuccess}
      />
    </div>
  );
}
