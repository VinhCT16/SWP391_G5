import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardBody, CardActions } from '../../../components/shared/Card';
import StatusBadge from '../../../components/shared/StatusBadge';
import Button from '../../../components/shared/Button';

export default function TaskListTab({ availableTasks, loading, error, onRefresh, onPickTask, onViewDetails }) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    taskType: '',
    priority: '',
    search: ''
  });

  const getTaskTypeIcon = (taskType) => {
    switch (taskType) {
      case 'Review': return '🔍';
      case 'Packaging': return '📦';
      case 'Unpackaging': return '📋';
      case 'Transporting': return '🚚';
      default: return '📝';
    }
  };


  const filteredTasks = availableTasks.filter(task => {
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

    return matchesType && matchesPriority && matchesSearch;
  });

  return (
    <div className="dashboard-section">
      <div className="dashboard-header-section">
        <h2>Available Tasks</h2>
        <p>Pick tasks you want to work on</p>
        <div className="dashboard-actions">
          <Button variant="info" onClick={onRefresh} disabled={loading}>
            🔄 Refresh
          </Button>
          <Button variant="secondary" onClick={() => setFilters({taskType: '', priority: '', search: ''})}>
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
            value={filters.taskType} 
            onChange={(e) => setFilters({...filters, taskType: e.target.value})}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="Review">Review</option>
            <option value="Packaging">Packaging</option>
            <option value="Unpackaging">Unpackaging</option>
            <option value="Transporting">Transporting</option>
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
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-state"><p>Loading available tasks...</p></div>
      ) : (
        <div className="tasks-grid">
          {filteredTasks.map((task) => (
            <Card key={task.taskId || task._id}>
              <CardHeader>
                <div className="task-title">
                  <span className="task-icon">{getTaskTypeIcon(task.taskType)}</span>
                  <h3>{task.taskType}</h3>
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
                  <div className="detail-row">
                    <strong>Priority:</strong> <span style={{ 
                      color: task.priority === 'high' ? '#f44336' : task.priority === 'medium' ? '#ff9800' : '#4caf50',
                      fontWeight: 'bold'
                    }}>{task.priority || 'medium'}</span>
                  </div>
                  {task.description && (
                    <div className="detail-row">
                      <strong>Description:</strong> {task.description}
                    </div>
                  )}
                </div>
              </CardBody>
              <CardActions>
                <Button variant="primary" onClick={() => onPickTask(task._id || task.taskId)}>
                  Pick Task
                </Button>
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
          <h3>No available tasks</h3>
          <p>No tasks match your current filters or all tasks have been picked.</p>
        </div>
      )}
    </div>
  );
}

