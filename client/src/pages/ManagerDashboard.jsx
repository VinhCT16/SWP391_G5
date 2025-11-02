import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllRequests, updateRequestStatus } from '../api/requestApi';
import { createTasksFromContract } from '../api/taskApi';
import { getContractsForApproval, approveContract, rejectContract, createContractFromRequest } from '../api/contractApi';
import BackButton from '../components/BackButton';
import './ManagerDashboard.css';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showCreateContractModal, setShowCreateContractModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    status: 'approved',
    rejectionReason: '',
    notes: ''
  });
  const [contractData, setContractData] = useState({
    pricing: {
      basePrice: 0,
      additionalServices: [],
      totalPrice: 0,
      deposit: 0
    },
    paymentMethod: {
      type: 'cash',
      details: {}
    },
    terms: {
      liability: 'Standard moving liability coverage',
      cancellation: '24-hour notice required for cancellation',
      additionalTerms: ''
    }
  });
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [activeTab, setActiveTab] = useState('requests');

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

  // Load contracts for approval
  const loadContracts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getContractsForApproval();
      setContracts(response.data.contracts || []);
    } catch (err) {
      console.error('Error loading contracts:', err);
      setError('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Handle contract creation
  const handleCreateContract = async () => {
    if (!selectedRequest) return;

    try {
      setLoading(true);
      await createContractFromRequest(selectedRequest._id, contractData);
      setShowCreateContractModal(false);
      setSelectedRequest(null);
      await loadRequests();
      alert('Contract created successfully!');
    } catch (err) {
      console.error('Error creating contract:', err);
      setError(err?.response?.data?.message || 'Failed to create contract');
    } finally {
      setLoading(false);
    }
  };

  // Handle contract approval
  const handleContractApproval = async () => {
    if (!selectedContract) return;

    try {
      setLoading(true);
      await approveContract(selectedContract._id, { notes: approvalData.notes });
      setShowContractModal(false);
      setSelectedContract(null);
      await loadContracts();
      alert('Contract approved successfully!');
    } catch (err) {
      console.error('Error approving contract:', err);
      setError(err?.response?.data?.message || 'Failed to approve contract');
    } finally {
      setLoading(false);
    }
  };

  // Handle contract rejection
  const handleContractRejection = async () => {
    if (!selectedContract) return;

    try {
      setLoading(true);
      await rejectContract(selectedContract._id, { 
        rejectionReason: approvalData.rejectionReason,
        notes: approvalData.notes 
      });
      setShowContractModal(false);
      setSelectedContract(null);
      await loadContracts();
      alert('Contract rejected successfully!');
    } catch (err) {
      console.error('Error rejecting contract:', err);
      setError(err?.response?.data?.message || 'Failed to reject contract');
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

  // Load requests and contracts on component mount
  useEffect(() => {
    loadRequests();
    loadContracts();
  }, [loadRequests, loadContracts]);

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
        {/* Navigation Tabs */}
        <div className="dashboard-nav">
          <button 
            className={activeTab === 'requests' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveTab('requests')}
          >
            Requests
          </button>
          <button 
            className={activeTab === 'contracts' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveTab('contracts')}
          >
            Contracts
          </button>
        </div>

        {activeTab === 'requests' && (
          <>
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
                  {request.status === 'approved' && (
                    <>
                      <button 
                        className="create-contract-btn"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowCreateContractModal(true);
                        }}
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
          </>
        )}

        {activeTab === 'contracts' && (
          <>
            <div className="dashboard-header-section">
              <h2>Contract Management</h2>
              <div className="dashboard-actions">
                <button 
                  className="refresh-btn"
                  onClick={loadContracts}
                  disabled={loading}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {loading && (
              <div className="loading-state">
                <p>Loading contracts...</p>
              </div>
            )}

            {!loading && contracts.length > 0 && (
              <div className="contracts-list">
                {contracts.map((contract) => (
                  <div key={contract._id} className="contract-card">
                    <div className="contract-header">
                      <h3>Contract #{contract.contractId}</h3>
                      <span className={`status-badge ${contract.status}`}>
                        {contract.status}
                      </span>
                    </div>
                    
                    <div className="contract-details">
                      <p><strong>Customer:</strong> {contract.customerId?.name}</p>
                      <p><strong>From:</strong> {contract.moveDetails?.fromAddress}</p>
                      <p><strong>To:</strong> {contract.moveDetails?.toAddress}</p>
                      <p><strong>Total Price:</strong> ${contract.pricing?.totalPrice}</p>
                      <p><strong>Created:</strong> {new Date(contract.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="contract-actions">
                      <button 
                        className="view-btn"
                        onClick={() => {
                          setSelectedContract(contract);
                          setShowContractModal(true);
                        }}
                      >
                        View Details
                      </button>
                      {contract.status === 'draft' && (
                        <>
                          <button 
                            className="approve-btn"
                            onClick={() => {
                              setSelectedContract(contract);
                              setApprovalData({ status: 'approved', notes: '' });
                              setShowContractModal(true);
                            }}
                          >
                            Approve
                          </button>
                          <button 
                            className="reject-btn"
                            onClick={() => {
                              setSelectedContract(contract);
                              setApprovalData({ status: 'rejected', rejectionReason: '', notes: '' });
                              setShowContractModal(true);
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && contracts.length === 0 && (
              <div className="empty-state">
                <h3>No contracts found</h3>
                <p>No contracts are pending approval.</p>
              </div>
            )}
          </>
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

      {/* Contract Modal */}
      {showContractModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              {approvalData.status === 'approved' ? 'Approve Contract' : 
               approvalData.status === 'rejected' ? 'Reject Contract' : 'Contract Details'}
            </h3>
            
            <div className="modal-body">
              <p><strong>Contract #{selectedContract?.contractId}</strong></p>
              <p><strong>Customer:</strong> {selectedContract?.customerId?.name}</p>
              <p><strong>From:</strong> {selectedContract?.moveDetails?.fromAddress}</p>
              <p><strong>To:</strong> {selectedContract?.moveDetails?.toAddress}</p>
              <p><strong>Total Price:</strong> ${selectedContract?.pricing?.totalPrice}</p>
              
              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  value={approvalData.notes}
                  onChange={(e) => setApprovalData({...approvalData, notes: e.target.value})}
                  placeholder="Add any notes..."
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
                onClick={() => setShowContractModal(false)}
              >
                Cancel
              </button>
              {approvalData.status === 'approved' && (
                <button 
                  className="approve-btn"
                  onClick={handleContractApproval}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Approve Contract'}
                </button>
              )}
              {approvalData.status === 'rejected' && (
                <button 
                  className="reject-btn"
                  onClick={handleContractRejection}
                  disabled={loading || !approvalData.rejectionReason}
                >
                  {loading ? 'Processing...' : 'Reject Contract'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Contract Modal */}
      {showCreateContractModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create Contract</h3>
            
            <div className="modal-body">
              <p><strong>Request #{selectedRequest?.requestId}</strong></p>
              <p><strong>Customer:</strong> {selectedRequest?.customerId?.name}</p>
              <p><strong>From:</strong> {selectedRequest?.moveDetails?.fromAddress}</p>
              <p><strong>To:</strong> {selectedRequest?.moveDetails?.toAddress}</p>
              
              <div className="form-group">
                <label>Base Price:</label>
                <input
                  type="number"
                  value={contractData.pricing.basePrice}
                  onChange={(e) => setContractData({
                    ...contractData,
                    pricing: { ...contractData.pricing, basePrice: parseFloat(e.target.value) }
                  })}
                  placeholder="Enter base price"
                />
              </div>
              
              <div className="form-group">
                <label>Total Price:</label>
                <input
                  type="number"
                  value={contractData.pricing.totalPrice}
                  onChange={(e) => setContractData({
                    ...contractData,
                    pricing: { ...contractData.pricing, totalPrice: parseFloat(e.target.value) }
                  })}
                  placeholder="Enter total price"
                />
              </div>
              
              <div className="form-group">
                <label>Deposit:</label>
                <input
                  type="number"
                  value={contractData.pricing.deposit}
                  onChange={(e) => setContractData({
                    ...contractData,
                    pricing: { ...contractData.pricing, deposit: parseFloat(e.target.value) }
                  })}
                  placeholder="Enter deposit amount"
                />
              </div>
              
              <div className="form-group">
                <label>Payment Method:</label>
                <select
                  value={contractData.paymentMethod.type}
                  onChange={(e) => setContractData({
                    ...contractData,
                    paymentMethod: { ...contractData.paymentMethod, type: e.target.value }
                  })}
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                </select>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowCreateContractModal(false)}
              >
                Cancel
              </button>
              <button 
                className="create-btn"
                onClick={handleCreateContract}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Contract'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
