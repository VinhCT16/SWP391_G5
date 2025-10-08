import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStaffTasks, updateTaskStatus } from '../api/taskApi';
import BackButton from '../components/BackButton';
import './StaffDashboard.css';

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusData, setStatusData] = useState({
    status: 'in-progress',
    notes: ''
  });
  const [filters, setFilters] = useState({
    status: '',
    taskType: ''
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

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = !filters.status || task.status === filters.status;
    const matchesType = !filters.taskType || task.taskType === filters.taskType;
    
    return matchesStatus && matchesType;
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
      
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">
            <h1>Staff Dashboard</h1>
            <span>Task Management System</span>
          </div>
          <div className="user-info">
            <span>Welcome, {user?.name}</span>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
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
              onClick={() => setFilters({status: '', taskType: ''})}
            >
              🗂️ Clear Filters
            </button>
          </div>
          <div className="filters">
            <select 
              value={filters.status} 
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in-progress">In Progress</option>
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
                      Mark Complete
                    </button>
                  )}
                  <button 
                    className="view-btn"
                    onClick={() => setSelectedTask(task)}
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
    </div>
  );
}
