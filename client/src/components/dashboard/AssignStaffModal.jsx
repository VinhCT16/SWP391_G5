import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';

export default function AssignStaffModal({ isOpen, onClose, request, availableStaff, onAssign, loading }) {
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedStaffId('');
      setAssignNotes('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (request && selectedStaffId) {
      await onAssign(request._id, { staffId: selectedStaffId, notes: assignNotes });
      onClose();
    }
  };

  if (!request) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Staff to Request">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Select Staff</label>
          <select 
            value={selectedStaffId} 
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="form-select"
            required
          >
            <option value="">-- Select --</option>
            {availableStaff.map(s => (
              <option key={s._id} value={s._id}>
                {s.userId?.name || s.employeeId} ({s.role})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea 
            value={assignNotes} 
            onChange={(e) => setAssignNotes(e.target.value)}
            className="form-textarea"
            rows="3"
          />
        </div>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!selectedStaffId || loading}>
            {loading ? 'Assigning...' : 'Assign'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

