import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardBody, CardActions } from '../../../components/shared/Card';
import StatusBadge from '../../../components/shared/StatusBadge';
import Button from '../../../components/shared/Button';

export default function ContractsTab({ contracts, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return <div className="loading-state"><p>Loading contracts...</p></div>;
  }

  if (contracts.length === 0) {
    return (
      <div className="empty-state">
        <h3>No contracts found</h3>
        <p>You don't have any contracts yet.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-section">
      <h2>My Contracts</h2>
      <div className="contracts-grid">
        {contracts.map((contract) => (
          <Card key={contract._id}>
            <CardHeader>
              <h3 style={{ margin: 0 }}>Contract #{contract.contractId}</h3>
              <StatusBadge status={contract.status} />
            </CardHeader>
            <CardBody>
              <p><strong>Service:</strong> {contract.serviceId?.name || 'N/A'}</p>
              <p><strong>Total Price:</strong> ${contract.pricing?.totalPrice || 0}</p>
              <p><strong>Status:</strong> {contract.status}</p>
              <p><strong>Created:</strong> {new Date(contract.createdAt).toLocaleDateString()}</p>
            </CardBody>
            <CardActions>
              <Button onClick={() => navigate(`/contracts/${contract._id}`)}>
                View Contract
              </Button>
            </CardActions>
          </Card>
        ))}
      </div>
    </div>
  );
}

