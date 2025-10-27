import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllRequests, updateRequestStatus } from '../api/requestApi';
import { createTasksFromContract } from '../api/taskApi';
import BackButton from '../components/BackButton';
import './ManagerDashboard.css';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    status: 'approved',
    rejectionReason: '',
    notes: ''
  });
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  // Load all requests
  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllRequests({ status: filters.status });
      setRequests(response.data.requests || []);
    } catch (err) {
      console.error('Error loading requests:', err);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [filters.status]);

  // Handle request approval/rejection
  const handleApproval = async () => {
    if (!selectedRequest) return;

    try {
      setLoading(true);
      await updateRequestStatus(selectedRequest._id, approvalData);
      
      // Reload requests
      await loadRequests();
      
      // Close modal and reset
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setApprovalData({
        status: 'approved',
        rejectionReason: '',
        notes: ''
      });
      
      alert(`Request ${approvalData.status} successfully!`);
    } catch (err) {
      console.error('Error updating request:', err);
      setError(err?.response?.data?.message || 'Failed to update request');
    } finally {
      setLoading(false);
    }
  };

  // Handle task creation
  const handleCreateTasks = async (request) => {
    try {
      setLoading(true);
      
      // Create standard tasks for a move
      const tasksData = {
        tasks: [
          {
            taskType: 'packing',
            estimatedDuration: 2
          },
          {
            taskType: 'loading',
            estimatedDuration: 1
          },
          {
            taskType: 'transporting',
            estimatedDuration: 3
          },
          {
            taskType: 'unloading',
            estimatedDuration: 1
          },
          {
            taskType: 'unpacking',
            estimatedDuration: 2
          }
        ]
      };

      await createTasksFromContract(request._id, tasksData);
      
      // Reload requests to show updated status
      await loadRequests();
      
      alert('Tasks created successfully!');
    } catch (err) {
      console.error('Error creating tasks:', err);
      setError(err?.response?.data?.message || 'Failed to create tasks');
    } finally {
      setLoading(false);
    }
  };

  // Open approval modal
  const openApprovalModal = (request, action) => {
    setSelectedRequest(request);
    setApprovalData({
      status: action,
      rejectionReason: '',
      notes: ''
    });
    setShowApprovalModal(true);
  };

  // Filter requests
  const filteredRequests = requests.filter(request => {
    const matchesStatus = !filters.status || request.status === filters.status;
    const matchesSearch = !filters.search || 
      request.requestId.toLowerCase().includes(filters.search.toLowerCase()) ||
      request.moveDetails.fromAddress.toLowerCase().includes(filters.search.toLowerCase()) ||
      request.moveDetails.toAddress.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Load requests on component mount
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  return (
    <div className="manager-dashboard">
      <BackButton fallbackPath="/dashboard" />
      
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">
            <h1>Manager Dashboard</h1>
            <span>Request Management System</span>
          </div>
          <div className="user-info">
            <span>Welcome, {user?.name}</span>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-header-section">
          <h2>Request Management</h2>
          <div className="dashboard-actions">
            <button 
              className="refresh-btn"
              onClick={loadRequests}
              disabled={loading}
            >
              🔄 Refresh
            </button>
            <button 
              className="filter-btn"
              onClick={() => setFilters({...filters, status: ''})}
            >
              🗂️ Clear Filters
            </button>
            <button 
              className="contract-approval-btn"
              onClick={() => navigate('/contract-approval')}
            >
              📋 Contract Approval
            </button>
          </div>
          <div className="filters">
            <select 
              value={filters.status} 
              onChange={(e) => setFilters({...filters, status: e.target.value})}
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
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="search-input"
            />
            <button onClick={loadRequests} className="refresh-btn">Refresh</button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <p>Loading requests...</p>
          </div>
        ) : (
          <div className="requests-grid">
            {filteredRequests.map((request) => (
              <div key={request._id} className="request-card">
                <div className="request-header">
                  <h3>Request #{request.requestId}</h3>
                  <span className={`status-badge ${request.status}`}>
                    {request.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="request-details">
                  <div className="detail-row">
                    <strong>Customer:</strong> {request.customerId?.name}
                  </div>
                  <div className="detail-row">
                    <strong>Email:</strong> {request.customerId?.email}
                  </div>
                  <div className="detail-row">
                    <strong>Phone:</strong> {request.moveDetails.phone}
                  </div>
                  <div className="detail-row">
                    <strong>From:</strong> {request.moveDetails.fromAddress}
                  </div>
                  <div className="detail-row">
                    <strong>To:</strong> {request.moveDetails.toAddress}
                  </div>
                  <div className="detail-row">
                    <strong>Date:</strong> {new Date(request.moveDetails.moveDate).toLocaleDateString()}
                  </div>
                  <div className="detail-row">
                    <strong>Service:</strong> {request.moveDetails.serviceType}
                  </div>
                  <div className="detail-row">
                    <strong>Submitted:</strong> {new Date(request.createdAt).toLocaleDateString()}
                  </div>
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

                <div className="request-actions">
                  {request.status === 'submitted' && (
                    <>
                      <button 
                        className="approve-btn"
                        onClick={() => openApprovalModal(request, 'approved')}
                      >
                        Approve
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => openApprovalModal(request, 'rejected')}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {request.status === 'approved' && (
                    <>
                      <button 
                        className="contract-btn"
                        onClick={() => navigate(`/contract-form/${request._id}`)}
                        disabled={loading}
                      >
                        Create Contract
                      </button>
                      <button 
                        className="view-btn"
                        onClick={() => setSelectedRequest(request)}
                      >
                        View Details
                      </button>
                    </>
                  )}
                  {request.status === 'contract_created' && (
                    <>
                      <button 
                        className="tasks-btn"
                        onClick={() => handleCreateTasks(request)}
                        disabled={loading}
                      >
                        Create Tasks
                      </button>
                      <button 
                        className="view-btn"
                        onClick={() => setSelectedRequest(request)}
                      >
                        View Contract
                      </button>
                    </>
                  )}
                  {request.status === 'in_progress' && (
                    <button 
                      className="view-btn"
                      onClick={() => setSelectedRequest(request)}
                    >
                      View Tasks
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredRequests.length === 0 && !loading && (
          <div className="empty-state">
            <h3>No requests found</h3>
            <p>No requests match your current filters.</p>
          </div>
        )}
      </main>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              {approvalData.status === 'approved' ? 'Approve Request' : 'Reject Request'}
            </h3>
            
            <div className="modal-body">
              <p>
                <strong>Request #{selectedRequest?.requestId}</strong>
              </p>
              <p>
                Customer: {selectedRequest?.customerId?.name}
              </p>
              
              <div className="form-group">
                <label>Notes (Optional):</label>
                <textarea
                  value={approvalData.notes}
                  onChange={(e) => setApprovalData({...approvalData, notes: e.target.value})}
                  placeholder="Add any notes about this decision..."
                  rows="3"
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
                  />
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowApprovalModal(false)}
              >
                Cancel
              </button>
              <button 
                className={`${approvalData.status}-btn`}
                onClick={handleApproval}
                disabled={loading || (approvalData.status === 'rejected' && !approvalData.rejectionReason)}
              >
                {loading ? 'Processing...' : `${approvalData.status === 'approved' ? 'Approve' : 'Reject'} Request`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
