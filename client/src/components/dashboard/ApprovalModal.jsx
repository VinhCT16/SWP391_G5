import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';

export default function ApprovalModal({ isOpen, onClose, request, onApprove, actionType = 'approve', loading }) {
  const [approvalData, setApprovalData] = useState({
    status: 'approved',
    rejectionReason: '',
    notes: ''
  });

  useEffect(() => {
    if (request) {
      const status = actionType === 'reject' ? 'rejected' : 'approved';
      setApprovalData({
        status: status,
        rejectionReason: '',
        notes: ''
      });
    }
  }, [request, actionType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (request) {
      await onApprove(request._id, approvalData);
      onClose();
    }
  };

  if (!request) return null;

  const isReject = actionType === 'reject' || approvalData.status === 'rejected';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isReject ? 'Reject Request' : 'Approve Request'} size="medium">
      <div style={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: '12px',
        padding: '28px',
        margin: '-20px -30px',
        minHeight: '100%'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Request Information */}
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
              <h3 style={{ margin: 0, color: '#1976d2', fontSize: '18px', fontWeight: 600 }}>Request Information</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ 
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #2196f3'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 500 }}>Request #</div>
                <div style={{ fontSize: '15px', color: '#333', fontWeight: 600 }}>{request.requestId || 'N/A'}</div>
              </div>
              <div style={{ 
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #4caf50'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 500 }}>Customer</div>
                <div style={{ fontSize: '15px', color: '#333', fontWeight: 600 }}>
                  {request.customerId?.name || request.customerName || 'N/A'}
                </div>
              </div>
            </div>
            {request.moveDetails && (
              <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ 
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  borderLeft: '4px solid #ff9800'
                }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 500 }}>From</div>
                  <div style={{ fontSize: '14px', color: '#333', fontWeight: 500 }}>
                    {request.moveDetails.fromAddress || 'N/A'}
                  </div>
                </div>
                <div style={{ 
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  borderLeft: '4px solid #9c27b0'
                }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 500 }}>To</div>
                  <div style={{ fontSize: '14px', color: '#333', fontWeight: 500 }}>
                    {request.moveDetails.toAddress || 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes Section */}
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
              value={approvalData.notes}
              onChange={(e) => setApprovalData({...approvalData, notes: e.target.value})}
              placeholder="Add any notes about this decision..."
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
          
          {/* Rejection Reason (only for reject) */}
          {isReject && (
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
                borderBottom: '2px solid #ffebee'
              }}>
                <span style={{ fontSize: '20px', marginRight: '10px' }}>⚠️</span>
                <label style={{ 
                  display: 'block', 
                  margin: 0,
                  fontWeight: 600, 
                  color: '#d32f2f',
                  fontSize: '16px'
                }}>
                  Rejection Reason <span style={{ color: '#d32f2f', fontSize: '14px' }}>*</span>
                </label>
              </div>
              <textarea
                value={approvalData.rejectionReason}
                onChange={(e) => setApprovalData({...approvalData, rejectionReason: e.target.value})}
                placeholder="Please provide a reason for rejection..."
                rows="4"
                required
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
                  e.target.style.borderColor = '#d32f2f';
                  e.target.style.boxShadow = '0 0 0 3px rgba(211, 47, 47, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e0e0e0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          )}
          
          {/* Actions */}
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
              variant={isReject ? 'danger' : 'success'}
              disabled={loading || (isReject && !approvalData.rejectionReason.trim())}
              style={{
                padding: '10px 24px',
                fontSize: '15px',
                fontWeight: 600,
                background: loading 
                  ? '#ccc' 
                  : isReject 
                    ? 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)'
                    : 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                border: 'none',
                boxShadow: loading ? 'none' : isReject 
                  ? '0 4px 6px rgba(211, 47, 47, 0.3)'
                  : '0 4px 6px rgba(76, 175, 80, 0.3)'
              }}
            >
              {loading 
                ? '⏳ Processing...' 
                : isReject 
                  ? '❌ Reject Request' 
                  : '✅ Approve Request'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

