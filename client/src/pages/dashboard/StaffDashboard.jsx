import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStaffTasks as getStaffTasksFromTaskApi, getAllAvailableTasks, pickTask, updateTaskStatus } from '../../api/taskApi';
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
  const [activeTab, setActiveTab] = useState('task-list');
  const [tasks, setTasks] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
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
      // Handle both response.tasks and response.data?.tasks
      setTasks(response.tasks || response.data?.tasks || []);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllAvailableTasks();
      setAvailableTasks(response.tasks || response.data?.tasks || []);
    } catch (err) {
      console.error('Error loading available tasks:', err);
      setError('Failed to load available tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'task-list') {
      loadAvailableTasks();
    } else if (activeTab === 'my-tasks' || activeTab === 'history') {
      loadTasks();
    }
  }, [activeTab]);

  const handleStatusUpdate = async (taskId, statusData) => {
    try {
      setLoading(true);
      await updateTaskStatus(taskId, statusData);
      await loadTasks();
    } catch (err) {
      console.error('Error updating task status:', err);
      // Handle both axios errors and fetch errors
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update task status';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const openStatusModal = (task, newStatus) => {
    setSelectedTask(newStatus !== undefined ? { ...task, status: newStatus } : task);
    setShowStatusModal(true);
  };

  const openDetailsModal = (task) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  };

  const handlePickTask = async (taskId) => {
    try {
      setLoading(true);
      await pickTask(taskId);
      await loadAvailableTasks(); // Refresh available tasks
      await loadTasks(); // Refresh assigned tasks
    } catch (err) {
      console.error('Error picking task:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to pick task';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSuccess = () => {
    loadTasks();
    loadAvailableTasks();
  };

  return (
    <div className="staff-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div>
            <h1>Staff Dashboard</h1>
            <span>Manage your assigned tasks</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
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

      <nav className="dashboard-nav">
        <button 
          className={activeTab === 'task-list' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('task-list')}
        >
          Task List
        </button>
        <button 
          className={activeTab === 'my-tasks' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('my-tasks')}
        >
          My Tasks
        </button>
        <button 
          className={activeTab === 'history' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button 
          className={activeTab === 'profile' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
      </nav>

      <main className="dashboard-main">
        {error && <div className="error-message">{error}</div>}
        <StaffDashboardTabs
          activeTab={activeTab}
          tasks={tasks}
          availableTasks={availableTasks}
          loading={loading}
          error={error}
          onRefresh={activeTab === 'task-list' ? loadAvailableTasks : loadTasks}
          onPickTask={handlePickTask}
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
