import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardBody, CardActions } from '../../../components/shared/Card';
import StatusBadge from '../../../components/shared/StatusBadge';
import Button from '../../../components/shared/Button';

export default function RequestsTab({
  requests,
  loading,
  error,
  filters,
  onFilterChange,
  onRefresh,
  onApprove,
  onReject,
  onAssignStaff,
  onCreateContract,
  onCreateTasks,
  onViewContract
}) {
  const navigate = useNavigate();
  const [localFilters, setLocalFilters] = useState(filters);

  const filteredRequests = requests.filter(request => {
    const matchesStatus = !localFilters.status || request.status === localFilters.status;
    const matchesSearch = !localFilters.search || 
      request.requestId.toLowerCase().includes(localFilters.search.toLowerCase()) ||
      request.moveDetails.fromAddress.toLowerCase().includes(localFilters.search.toLowerCase()) ||
      request.moveDetails.toAddress.toLowerCase().includes(localFilters.search.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="dashboard-section">
      <div className="dashboard-header-section">
        <h2>Request Management</h2>
        <div className="dashboard-actions">
          <Button variant="info" onClick={onRefresh} disabled={loading}>
            🔄 Refresh
          </Button>
          <Button variant="secondary" onClick={() => setLocalFilters({...localFilters, status: ''})}>
            🗂️ Clear Filters
          </Button>
          <Button variant="primary" onClick={() => navigate('/contract-approval')}>
            📋 Contract Approval
          </Button>
        </div>
      </div>
      
      <div className="filters">
        <select 
          value={localFilters.status} 
          onChange={(e) => {
            setLocalFilters({...localFilters, status: e.target.value});
            onFilterChange?.('status', e.target.value);
          }}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <input
          type="text"
          placeholder="Search requests..."
          value={localFilters.search}
          onChange={(e) => {
            setLocalFilters({...localFilters, search: e.target.value});
            onFilterChange?.('search', e.target.value);
          }}
          className="filter-input"
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-state"><p>Loading requests...</p></div>
      ) : (
        <div className="requests-grid">
          {filteredRequests.map((request) => (
            <Card key={request._id}>
              <CardHeader>
                <h3>Request #{request.requestId}</h3>
                <StatusBadge status={request.status} />
              </CardHeader>
              <CardBody>
                <div className="request-details">
                  <div className="detail-row"><strong>Customer:</strong> {request.customerId?.name}</div>
                  <div className="detail-row"><strong>Email:</strong> {request.customerId?.email}</div>
                  <div className="detail-row"><strong>Phone:</strong> {request.moveDetails.phone}</div>
                  <div className="detail-row"><strong>From:</strong> {request.moveDetails.fromAddress}</div>
                  <div className="detail-row"><strong>To:</strong> {request.moveDetails.toAddress}</div>
                  <div className="detail-row"><strong>Date:</strong> {new Date(request.moveDetails.moveDate).toLocaleDateString()}</div>
                  <div className="detail-row"><strong>Service:</strong> {request.moveDetails.serviceType}</div>
                  <div className="detail-row"><strong>Submitted:</strong> {new Date(request.createdAt).toLocaleDateString()}</div>
                </div>

                {request.approval && (
                  <div className="approval-info">
                    <h4>Review Details:</h4>
                    <p><strong>Status:</strong> {request.approval.approved ? 'Approved' : 'Rejected'}</p>
                    {request.approval.rejectionReason && (
                      <p><strong>Reason:</strong> {request.approval.rejectionReason}</p>
                    )}
                    {request.approval.notes && (
                      <p><strong>Notes:</strong> {request.approval.notes}</p>
                    )}
                    <p><strong>Reviewed:</strong> {new Date(request.approval.reviewedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </CardBody>
              <CardActions>
                {request.status === 'submitted' && (
                  <>
                    <Button variant="success" onClick={() => onApprove(request)}>Approve</Button>
                    <Button variant="danger" onClick={() => onReject(request)}>Reject</Button>
                  </>
                )}
                {request.status === 'approved' && (
                  <>
                    {!request.contractId ? (
                      <Button onClick={() => navigate(`/contract-form/${request._id}`)} disabled={loading}>
                        Create Contract
                      </Button>
                    ) : (
                      <Button variant="secondary" onClick={() => onViewContract(request)}>
                        View Details
                      </Button>
                    )}
                    <Button variant="info" onClick={() => onAssignStaff(request)}>
                      Assign Staff
                    </Button>
                  </>
                )}
                {request.status === 'contract_created' && (
                  <>
                    <Button variant="warning" onClick={() => onCreateTasks(request)} disabled={loading}>
                      Create Tasks
                    </Button>
                    <Button variant="secondary" onClick={() => onViewContract(request)}>
                      View Contract
                    </Button>
                  </>
                )}
                {request.status === 'in_progress' && (
                  <Button variant="secondary" onClick={() => onViewContract(request)}>
                    View Tasks
                  </Button>
                )}
              </CardActions>
            </Card>
          ))}
        </div>
      )}

      {filteredRequests.length === 0 && !loading && (
        <div className="empty-state">
          <h3>No requests found</h3>
          <p>No requests match your current filters.</p>
        </div>
      )}
    </div>
  );
}

