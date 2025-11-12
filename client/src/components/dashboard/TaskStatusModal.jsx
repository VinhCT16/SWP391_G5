import React, { useState } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';

export default function TaskStatusModal({ isOpen, onClose, task, onUpdate, loading }) {
  const [statusData, setStatusData] = useState({
    status: 'in-progress',
    notes: ''
  });

  React.useEffect(() => {
    if (task) {
      setStatusData({
        status: task.status === 'pending' || task.status === 'assigned' ? 'in-progress' : task.status,
        notes: ''
      });
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (task) {
      await onUpdate(task.requestId, task.taskId, statusData);
      onClose();
    }
  };

  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Task Status">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <p><strong>Task:</strong> {task.taskType?.charAt(0).toUpperCase() + task.taskType?.slice(1)}</p>
          <p><strong>Request #:</strong> {task.requestNumber}</p>
          <p><strong>Customer:</strong> {task.customer?.name}</p>
        </div>
        
        <div className="form-group">
          <label>Status:</label>
          <select
            value={statusData.status}
            onChange={(e) => setStatusData({...statusData, status: e.target.value})}
            className="form-select"
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
            className="form-textarea"
          />
        </div>
        
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Status'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

