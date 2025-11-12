import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';

export default function ApprovalModal({ isOpen, onClose, request, onApprove, loading }) {
  const [approvalData, setApprovalData] = useState({
    status: 'approved',
    rejectionReason: '',
    notes: ''
  });

  useEffect(() => {
    if (request) {
      setApprovalData({
        status: 'approved',
        rejectionReason: '',
        notes: ''
      });
    }
  }, [request]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (request) {
      await onApprove(request._id, approvalData);
      onClose();
    }
  };

  if (!request) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={approvalData.status === 'approved' ? 'Approve Request' : 'Reject Request'}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <p><strong>Request #{request.requestId}</strong></p>
          <p>Customer: {request.customerId?.name}</p>
        </div>
        
        <div className="form-group">
          <label>Notes (Optional):</label>
          <textarea
            value={approvalData.notes}
            onChange={(e) => setApprovalData({...approvalData, notes: e.target.value})}
            placeholder="Add any notes about this decision..."
            rows="3"
            className="form-textarea"
          />
        </div>
        
        {approvalData.status === 'rejected' && (
          <div className="form-group">
            <label>Rejection Reason (Required):</label>
            <textarea
              value={approvalData.rejectionReason}
              onChange={(e) => setApprovalData({...approvalData, rejectionReason: e.target.value})}
              placeholder="Please provide a reason for rejection..."
              rows="3"
              required
              className="form-textarea"
            />
          </div>
        )}
        
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button 
            type="submit" 
            variant={approvalData.status === 'approved' ? 'success' : 'danger'}
            disabled={loading || (approvalData.status === 'rejected' && !approvalData.rejectionReason)}
          >
            {loading ? 'Processing...' : `${approvalData.status === 'approved' ? 'Approve' : 'Reject'} Request`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

