import React, { useState } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import StatusBadge from '../shared/StatusBadge';

export default function TaskStatusModal({ isOpen, onClose, task, onUpdate, loading }) {
  const [statusData, setStatusData] = useState({
    status: 'in-progress',
    notes: ''
  });

  React.useEffect(() => {
    if (task) {
      // Determine default status based on current status
      let defaultStatus = 'in-progress';
      if (task.status === 'pending' || task.status === 'assigned') {
        defaultStatus = 'in-progress';
      } else if (task.status === 'in-progress') {
        defaultStatus = 'completed';
      } else {
        defaultStatus = task.status;
      }
      
      setStatusData({
        status: defaultStatus,
        notes: ''
      });
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (task) {
      // Use task._id or task.taskId (for backward compatibility)
      const taskId = task._id || task.taskId;
      await onUpdate(taskId, statusData);
      onClose();
    }
  };

  // Get task type display name
  const getTaskTypeName = (type) => {
    const types = {
      'packing': 'Packing',
      'loading': 'Loading',
      'transporting': 'Transporting',
      'unloading': 'Unloading',
      'unpacking': 'Unpacking',
      'review': 'Review/Survey'
    };
    return types[type] || type?.charAt(0).toUpperCase() + type?.slice(1) || 'N/A';
  };

  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Task Status" size="medium">
      <div style={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: '12px',
        padding: '28px',
        margin: '-20px -30px',
        minHeight: '100%'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Task Information */}
          <div style={{ 
            backgroundColor: '#fff', 
            padding: '24px', 
            marginBottom: '20px', 
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '2px solid #e3f2fd'
            }}>
              <span style={{ fontSize: '24px', marginRight: '12px' }}>📋</span>
              <h3 style={{ margin: 0, color: '#1976d2', fontSize: '18px', fontWeight: 600 }}>Task Information</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ 
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #2196f3'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 500 }}>Task Type</div>
                <div style={{ fontSize: '15px', color: '#333', fontWeight: 600 }}>{getTaskTypeName(task.taskType)}</div>
              </div>
              <div style={{ 
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #4caf50'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 500 }}>Current Status</div>
                <div style={{ marginTop: '4px' }}><StatusBadge status={task.status} /></div>
              </div>
              <div style={{ 
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #ff9800'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 500 }}>Request #</div>
                <div style={{ fontSize: '15px', color: '#333', fontWeight: 600 }}>{task.requestNumber || task.requestId || 'N/A'}</div>
              </div>
              <div style={{ 
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #9c27b0'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 500 }}>Customer</div>
                <div style={{ fontSize: '15px', color: '#333', fontWeight: 600 }}>
                  {task.customer?.name || task.request?.customerName || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        
          <div style={{ 
            backgroundColor: '#fff', 
            padding: '24px', 
            marginBottom: '20px', 
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '2px solid #e3f2fd'
            }}>
              <span style={{ fontSize: '20px', marginRight: '10px' }}>🔄</span>
              <label style={{ 
                display: 'block', 
                margin: 0,
                fontWeight: 600, 
                color: '#1976d2',
                fontSize: '16px'
              }}>
                New Status <span style={{ color: '#d32f2f', fontSize: '14px' }}>*</span>
              </label>
            </div>
            <select
              value={statusData.status}
              onChange={(e) => setStatusData({...statusData, status: e.target.value})}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '15px',
                backgroundColor: '#fff',
                color: '#333',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2196f3';
                e.target.style.boxShadow = '0 0 0 3px rgba(33, 150, 243, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e0e0e0';
                e.target.style.boxShadow = 'none';
              }}
            >
              {task.status === 'pending' || task.status === 'assigned' ? (
                <>
                  <option value="in-progress">🚀 In Progress</option>
                  <option value="blocked">⚠️ Blocked</option>
                  <option value="cancelled">❌ Cancelled</option>
                </>
              ) : task.status === 'in-progress' ? (
                <>
                  <option value="completed">✅ Completed</option>
                  <option value="blocked">⚠️ Blocked</option>
                  <option value="cancelled">❌ Cancelled</option>
                </>
              ) : (
                <>
                  <option value="in-progress">🚀 In Progress</option>
                  <option value="blocked">⚠️ Blocked</option>
                  <option value="completed">✅ Completed</option>
                  <option value="cancelled">❌ Cancelled</option>
                </>
              )}
            </select>
          </div>
          
          <div style={{ 
            backgroundColor: '#fff', 
            padding: '24px', 
            marginBottom: '20px', 
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '2px solid #e3f2fd'
            }}>
              <span style={{ fontSize: '20px', marginRight: '10px' }}>📝</span>
              <label style={{ 
                display: 'block', 
                margin: 0,
                fontWeight: 600, 
                color: '#1976d2',
                fontSize: '16px'
              }}>
                Notes (Optional)
              </label>
            </div>
            <textarea
              value={statusData.notes}
              onChange={(e) => setStatusData({...statusData, notes: e.target.value})}
              placeholder="Add any notes about this status update..."
              rows="4"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '100px',
                transition: 'all 0.3s ease',
                outline: 'none',
                lineHeight: '1.5'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2196f3';
                e.target.style.boxShadow = '0 0 0 3px rgba(33, 150, 243, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e0e0e0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <div style={{ 
            backgroundColor: '#fff', 
            padding: '20px 24px', 
            borderRadius: '12px',
            marginTop: '20px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onClose} 
              disabled={loading}
              style={{
                padding: '10px 24px',
                fontSize: '15px',
                fontWeight: 600
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading}
              style={{
                padding: '10px 24px',
                fontSize: '15px',
                fontWeight: 600,
                background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                boxShadow: loading ? 'none' : '0 4px 6px rgba(102, 126, 234, 0.3)'
              }}
            >
              {loading ? '⏳ Updating...' : '✅ Update Status'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

