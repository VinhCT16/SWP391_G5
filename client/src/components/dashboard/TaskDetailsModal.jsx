import React from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';

export default function TaskDetailsModal({ isOpen, onClose, task, onStart, onComplete }) {
  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Task Details" size="large">
      <div className="form-group">
        <p><strong>Task Type:</strong> {task.taskType}</p>
        <p><strong>Request #:</strong> {task.requestNumber}</p>
        <p><strong>Status:</strong> {task.status}</p>
        <p><strong>Priority:</strong> {task.priority || 'N/A'}</p>
        <p><strong>Description:</strong> {task.description || 'No description provided.'}</p>
        <p><strong>Deadline:</strong> {task.deadline ? new Date(task.deadline).toLocaleString() : 'N/A'}</p>
        <p><strong>Manager Notes:</strong> {task.managerNotes || '—'}</p>
        <p><strong>Customer Notes:</strong> {task.customerNotes || '—'}</p>
        <div className="detail-row"><strong>From:</strong> {task.moveDetails?.fromAddress}</div>
        <div className="detail-row"><strong>To:</strong> {task.moveDetails?.toAddress}</div>
        <div className="detail-row"><strong>Move Date:</strong> {task.moveDetails?.moveDate ? new Date(task.moveDetails.moveDate).toLocaleDateString() : 'N/A'}</div>
      </div>
      
      {Array.isArray(task?.attachments) && task.attachments.length > 0 && (
        <div className="form-group">
          <strong>Attachments:</strong>
          <ul>
            {task.attachments.map((att, idx) => (
              <li key={idx}><a href={att.url} target="_blank" rel="noreferrer">{att.name || `Attachment ${idx+1}`}</a></li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="modal-actions">
        <Button variant="secondary" onClick={onClose}>Close</Button>
        {(task.status === 'pending' || task.status === 'assigned') && onStart && (
          <Button onClick={() => { onClose(); onStart(task); }}>Start</Button>
        )}
        {task.status === 'in-progress' && onComplete && (
          <Button variant="info" onClick={() => { onClose(); onComplete(task); }}>Done</Button>
        )}
      </div>
    </Modal>
  );
}

