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
  onViewContract
}) {
  const navigate = useNavigate();
  const [localFilters, setLocalFilters] = useState(filters);

  // Group requests by status for display
  const groupedRequests = {
    pending: requests.filter(r => r.status === 'pending' || r.status === 'PENDING'),
    under_survey: requests.filter(r => r.status === 'UNDER_SURVEY' || r.status === 'under_survey'),
    contract_created: requests.filter(r => r.status === 'contract_created')
  };

  // Apply search filter to all groups
  const applySearchFilter = (requestList) => {
    if (!localFilters.search) return requestList;
    const searchLower = localFilters.search.toLowerCase();
    return requestList.filter(request => 
      request.requestId.toLowerCase().includes(searchLower) ||
      request.moveDetails?.fromAddress?.toLowerCase().includes(searchLower) ||
      request.moveDetails?.toAddress?.toLowerCase().includes(searchLower)
    );
  };

  const filteredPending = applySearchFilter(groupedRequests.pending);
  const filteredUnderSurvey = applySearchFilter(groupedRequests.under_survey);
  const filteredContractCreated = applySearchFilter(groupedRequests.contract_created);

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
          <option value="PENDING">Pending</option>
          <option value="UNDER_SURVEY">Under Survey</option>
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
        <div className="requests-sections">
          {/* Waiting for Manager Section */}
          {filteredPending.length > 0 && (
            <div className="request-section">
              <h3 className="section-title">⏳ Waiting for Manager</h3>
              <div className="requests-grid">
                {filteredPending.map((request) => (
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
                    </CardBody>
                    <CardActions>
                      <Button variant="info" onClick={() => navigate(`/manager/requests/${request._id}/detail`)}>
                        📋 View Details
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Waiting for Surveyor Section */}
          {filteredUnderSurvey.length > 0 && (
            <div className="request-section">
              <h3 className="section-title">🔍 Waiting for Surveyor</h3>
              <div className="requests-grid">
                {filteredUnderSurvey.map((request) => (
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
                    </CardBody>
                    <CardActions>
                      <Button variant="info" onClick={() => navigate(`/manager/requests/${request._id}/detail`)}>
                        📋 View Details
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Manager Approved Section */}
          {filteredContractCreated.length > 0 && (
            <div className="request-section">
              <h3 className="section-title">✅ Manager Approved</h3>
              <div className="requests-grid">
                {filteredContractCreated.map((request) => (
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
                    </CardBody>
                    <CardActions>
                      <Button variant="info" onClick={() => navigate(`/manager/requests/${request._id}/detail`)}>
                        📋 View Details
                      </Button>
                      <Button variant="secondary" onClick={() => onViewContract(request)}>
                        View Contract
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {filteredPending.length === 0 && filteredUnderSurvey.length === 0 && filteredContractCreated.length === 0 && !loading && (
            <div className="empty-state">
              <h3>No requests found</h3>
              <p>No requests match your current filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

