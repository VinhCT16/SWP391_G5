import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardBody, CardActions } from '../../../components/shared/Card';
import StatusBadge from '../../../components/shared/StatusBadge';
import Button from '../../../components/shared/Button';

export default function MyTasksTab({ tasks, loading, error, onRefresh, onUpdateStatus, onViewDetails }) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: '',
    taskType: '',
    priority: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });

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
      case 'review': return '🔍';
      default: return '📝';
    }
  };

  const handleReviewItems = (task) => {
    // Navigate to QuoteItemsPage with request data
    // task.requestId is the request's _id (MongoDB ObjectId)
    const requestData = {
      requestId: task.requestId || task.request?._id || task._id,
      requestNumber: task.requestNumber || task.request?.requestId,
      customerName: task.customer?.name || task.request?.customerName,
      customerPhone: task.customer?.phone || task.request?.customerPhone,
      pickupAddress: task.moveDetails?.fromAddress || task.request?.moveDetails?.fromAddress,
      deliveryAddress: task.moveDetails?.toAddress || task.request?.moveDetails?.toAddress,
      movingTime: task.moveDetails?.moveDate || task.request?.moveDetails?.moveDate,
      serviceType: task.moveDetails?.serviceType || task.request?.moveDetails?.serviceType,
      taskId: task.taskId || task._id, // Use taskId or _id for the task
      isStaffReview: true // Flag to indicate this is a staff review
    };
    
    navigate('/quote/items', { state: requestData });
  };

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

    const taskDateStr = task?.moveDetails?.moveDate || task?.createdAt;
    const taskDate = taskDateStr ? new Date(taskDateStr) : null;
    const fromOk = !filters.dateFrom || (taskDate && taskDate >= new Date(filters.dateFrom));
    const toOk = !filters.dateTo || (taskDate && taskDate <= new Date(filters.dateTo + 'T23:59:59'));

    return matchesStatus && matchesType && matchesPriority && matchesSearch && fromOk && toOk;
  });

  return (
    <div className="dashboard-section">
      <div className="dashboard-header-section">
        <h2>My Tasks</h2>
        <div className="dashboard-actions">
          <Button variant="info" onClick={onRefresh} disabled={loading}>
            🔄 Refresh
          </Button>
          <Button variant="secondary" onClick={() => setFilters({status: '', taskType: '', priority: '', search: '', dateFrom: '', dateTo: ''})}>
            🗂️ Clear Filters
          </Button>
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
            <option value="review">Review</option>
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

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-state"><p>Loading tasks...</p></div>
      ) : (
        <div className="tasks-grid">
          {filteredTasks.map((task) => (
            <Card key={task.taskId}>
              <CardHeader>
                <div className="task-title">
                  <span className="task-icon">{getTaskTypeIcon(task.taskType)}</span>
                  <h3>{task.taskType?.charAt(0).toUpperCase() + task.taskType?.slice(1)}</h3>
                </div>
                <StatusBadge status={task.status} />
              </CardHeader>
              <CardBody>
                <div className="task-details">
                  <div className="detail-row">
                    <strong>Request #:</strong> {task.requestNumber || task.requestId || 'N/A'}
                  </div>
                  <div className="detail-row">
                    <strong>Customer:</strong> {task.customer?.name || task.request?.customerName || 'N/A'}
                  </div>
                  <div className="detail-row">
                    <strong>Email:</strong> {task.customer?.email || task.request?.customerEmail || 'N/A'}
                  </div>
                  <div className="detail-row">
                    <strong>Phone:</strong> {task.customer?.phone || task.request?.customerPhone || task.moveDetails?.phone || 'N/A'}
                  </div>
                  <div className="detail-row">
                    <strong>From:</strong> {task.moveDetails?.fromAddress || task.request?.moveDetails?.fromAddress || 'N/A'}
                  </div>
                  <div className="detail-row">
                    <strong>To:</strong> {task.moveDetails?.toAddress || task.request?.moveDetails?.toAddress || 'N/A'}
                  </div>
                  <div className="detail-row">
                    <strong>Move Date:</strong> {
                      task.moveDetails?.moveDate 
                        ? new Date(task.moveDetails.moveDate).toLocaleDateString() 
                        : task.request?.moveDetails?.moveDate
                        ? new Date(task.request.moveDetails.moveDate).toLocaleDateString()
                        : 'N/A'
                    }
                  </div>
                  <div className="detail-row">
                    <strong>Duration:</strong> {task.estimatedDuration ? `${task.estimatedDuration} hours` : 'N/A'}
                  </div>
                  {task.isTransporter && (
                    <div className="detail-row">
                      <strong>Role:</strong> <span className="role-badge">Transporter</span>
                    </div>
                  )}
                </div>
              </CardBody>
              <CardActions>
                {/* Special button for review tasks */}
                {task.taskType === 'review' && (
                  <Button 
                    variant="primary" 
                    onClick={() => handleReviewItems(task)}
                    style={{ background: '#2196f3', color: 'white' }}
                  >
                    📋 List Items
                  </Button>
                )}
                {task.status === 'pending' && (
                  <Button variant="success" onClick={() => onUpdateStatus(task, 'in-progress')}>
                    Start Task
                  </Button>
                )}
                {task.status === 'assigned' && (
                  <Button variant="success" onClick={() => onUpdateStatus(task, 'in-progress')}>
                    Start Task
                  </Button>
                )}
                {task.status === 'in-progress' && (
                  <Button variant="info" onClick={() => onUpdateStatus(task, 'completed')}>
                    Done
                  </Button>
                )}
                {(task.status !== 'completed' && task.status !== 'cancelled') && (
                  <Button variant="warning" onClick={() => onUpdateStatus(task, 'blocked')}>
                    Blocked
                  </Button>
                )}
                <Button variant="secondary" onClick={() => onViewDetails(task)}>
                  View Details
                </Button>
              </CardActions>
            </Card>
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
  );
}

