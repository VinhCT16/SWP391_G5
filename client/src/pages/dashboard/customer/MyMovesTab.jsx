import React from 'react';
import Card, { CardHeader, CardBody } from '../../../components/shared/Card';
import StatusBadge from '../../../components/shared/StatusBadge';
import Button from '../../../components/shared/Button';

export default function MyMovesTab({ requests, loading, onTabChange }) {
  const getStatusColor = (status) => {
    switch(status) {
      case 'submitted': return { bg: '#e3f2fd', color: '#1976d2' };
      case 'approved': return { bg: '#e8f5e8', color: '#2e7d32' };
      case 'rejected': return { bg: '#ffebee', color: '#d32f2f' };
      default: return { bg: '#f5f5f5', color: '#666' };
    }
  };

  if (loading) {
    return <div className="loading-state"><p>Loading your moves...</p></div>;
  }

  if (requests.length === 0) {
    return (
      <div className="empty-state">
        <h3>No moves booked yet</h3>
        <p>Book your first move to get started!</p>
        <Button onClick={() => onTabChange('book-move')}>Book a Move</Button>
      </div>
    );
  }

  return (
    <div className="dashboard-section">
      <h2>My Moves</h2>
      <div className="moves-list">
        {requests.map((request) => {
          const statusColors = getStatusColor(request.status);
          return (
            <Card key={request._id}>
              <CardHeader>
                <h3 style={{ margin: 0 }}>Request #{request.requestId}</h3>
                <StatusBadge status={request.status} />
              </CardHeader>
              <CardBody>
                <div className="move-details">
                  <p><strong>From:</strong> {request.moveDetails?.fromAddress}</p>
                  <p><strong>To:</strong> {request.moveDetails?.toAddress}</p>
                  <p><strong>Date:</strong> {request.moveDetails?.moveDate ? new Date(request.moveDetails.moveDate).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Service:</strong> {request.moveDetails?.serviceType}</p>
                  <p><strong>Phone:</strong> {request.moveDetails?.phone}</p>
                  <p><strong>Submitted:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
                </div>
                {request.approval && (
                  <div className="approval-info">
                    <p><strong>Review Status:</strong> {request.approval.approved ? 'Approved' : 'Rejected'}</p>
                    {request.approval.rejectionReason && (
                      <p><strong>Reason:</strong> {request.approval.rejectionReason}</p>
                    )}
                    {request.approval.notes && (
                      <p><strong>Notes:</strong> {request.approval.notes}</p>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

