import React from 'react';
import Card, { CardHeader, CardBody, CardActions } from '../../../components/shared/Card';
import StatusBadge from '../../../components/shared/StatusBadge';
import Button from '../../../components/shared/Button';

export default function ContractsTab({
  contracts,
  loading,
  error,
  onRefresh,
  onView,
  onApprove,
  onReject
}) {
  return (
    <div className="dashboard-section">
      <div className="dashboard-header-section">
        <h2>Contract Management</h2>
        <div className="dashboard-actions">
          <Button variant="info" onClick={onRefresh} disabled={loading}>
            🔄 Refresh
          </Button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-state"><p>Loading contracts...</p></div>
      ) : contracts.length > 0 ? (
        <div className="contracts-list">
          {contracts.map((contract) => (
            <Card key={contract._id}>
              <CardHeader>
                <h3>Contract #{contract.contractId}</h3>
                <StatusBadge status={contract.status} />
              </CardHeader>
              <CardBody>
                <div className="contract-details">
                  <p><strong>Customer:</strong> {contract.customerId?.name}</p>
                  <p><strong>From:</strong> {contract.moveDetails?.fromAddress}</p>
                  <p><strong>To:</strong> {contract.moveDetails?.toAddress}</p>
                  <p><strong>Total Price:</strong> {new Intl.NumberFormat('vi-VN').format(contract.pricing?.totalPrice || 0)} đ</p>
                  <p><strong>Created:</strong> {new Date(contract.createdAt).toLocaleDateString()}</p>
                </div>
              </CardBody>
              <CardActions>
                <Button variant="secondary" onClick={() => onView(contract)}>
                  View Details
                </Button>
                {contract.status === 'draft' && (
                  <>
                    <Button variant="success" onClick={() => onApprove(contract)}>
                      Approve
                    </Button>
                    <Button variant="danger" onClick={() => onReject(contract)}>
                      Reject
                    </Button>
                  </>
                )}
              </CardActions>
            </Card>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No contracts found</h3>
          <p>No contracts are pending approval.</p>
        </div>
      )}
    </div>
  );
}

