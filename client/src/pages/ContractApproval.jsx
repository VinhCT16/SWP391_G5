import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getContractsForApproval, 
  approveContract, 
  rejectContract, 
  getContractById,
  assignStaffToContract, 
  getAvailableStaff,
  approveAndAssignContract
} from '../api/contractApi';
import './ContractApproval.css';

const ContractApproval = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContract, setSelectedContract] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showAssignStaffModal, setShowAssignStaffModal] = useState(false);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [staffNotes, setStaffNotes] = useState('');
  const [contractDetails, setContractDetails] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await getContractsForApproval();
      setContracts(response.data.contracts || []);
    } catch (err) {
      setError('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      // If a staff is selected in the modal, approve and assign in one call
      if (selectedStaffId) {
        await approveAndAssignContract({
          contractId: selectedContract._id,
          staffId: selectedStaffId,
          notes: approvalNotes
        });
      } else {
        await approveContract(selectedContract._id, { notes: approvalNotes });
      }
      setShowApprovalModal(false);
      setApprovalNotes('');
      setSelectedContract(null);
      setSelectedStaffId('');
      loadContracts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve contract');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      await rejectContract(selectedContract._id, { 
        rejectionReason, 
        notes: rejectionNotes 
      });
      setShowRejectionModal(false);
      setRejectionReason('');
      setRejectionNotes('');
      setSelectedContract(null);
      loadContracts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject contract');
    }
  };

  const openApprovalModal = (contract) => {
    setSelectedContract(contract);
    setShowApprovalModal(true);
  };

  const openRejectionModal = (contract) => {
    setSelectedContract(contract);
    setShowRejectionModal(true);
  };

  const openAssignStaffModal = async (contract) => {
    try {
      setSelectedContract(contract);
      
      // Load contract details with assigned staff
      const response = await getContractById(contract._id);
      setContractDetails(response.data.contract);
      
      // Load available staff
      const staffResponse = await getAvailableStaff(contract._id);
      setAvailableStaff(staffResponse.data.availableStaff || []);
      
      setShowAssignStaffModal(true);
    } catch (err) {
      setError('Failed to load staff information');
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedStaffId) {
      setError('Please select a staff member');
      return;
    }

    try {
      await assignStaffToContract(selectedContract._id, {
        staffId: selectedStaffId,
        notes: staffNotes
      });
      
      setShowAssignStaffModal(false);
      setSelectedStaffId('');
      setStaffNotes('');
      setSelectedContract(null);
      setContractDetails(null);
      loadContracts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign staff');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { class: 'status-draft', text: 'Draft' },
      pending_approval: { class: 'status-pending', text: 'Pending Approval' },
      approved: { class: 'status-approved', text: 'Approved' },
      signed: { class: 'status-signed', text: 'Signed' },
      active: { class: 'status-active', text: 'Active' },
      completed: { class: 'status-completed', text: 'Completed' },
      cancelled: { class: 'status-cancelled', text: 'Cancelled' }
    };

    const config = statusConfig[status] || { class: 'status-default', text: status };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="contract-approval-container">
        <div className="loading">Loading contracts...</div>
      </div>
    );
  }

  return (
    <div className="contract-approval-container">
      <div className="contract-approval-header">
        <h1>Contract Approval</h1>
        <p>Review and approve/reject pending contracts</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="contracts-list">
        {contracts.length === 0 ? (
          <div className="no-contracts">
            <p>No contracts pending approval</p>
          </div>
        ) : (
          contracts.map(contract => (
            <div key={contract._id} className="contract-card">
              <div className="contract-header">
                <div className="contract-info">
                  <h3>Contract #{contract.contractId}</h3>
                  <p>Customer: {contract.customerId?.name}</p>
                  <p>Service: {contract.serviceId?.name}</p>
                </div>
                <div className="contract-status">
                  {getStatusBadge(contract.status)}
                </div>
              </div>

              <div className="contract-details">
                <div className="detail-section">
                  <h4>Move Details</h4>
                  <p><strong>From:</strong> {contract.moveDetails?.fromAddress}</p>
                  <p><strong>To:</strong> {contract.moveDetails?.toAddress}</p>
                  <p><strong>Date:</strong> {formatDate(contract.moveDetails?.moveDate)}</p>
                  <p><strong>Type:</strong> {contract.moveDetails?.serviceType}</p>
                </div>

                <div className="detail-section">
                  <h4>Pricing</h4>
                  <p><strong>Base Price:</strong> ${contract.pricing?.basePrice}</p>
                  <p><strong>Total Price:</strong> ${contract.pricing?.totalPrice}</p>
                  <p><strong>Deposit:</strong> ${contract.pricing?.deposit}</p>
                  <p><strong>Balance:</strong> ${contract.pricing?.balance}</p>
                </div>

                <div className="detail-section">
                  <h4>Payment Method</h4>
                  <p><strong>Type:</strong> {contract.paymentMethod?.type}</p>
                </div>
              </div>

              <div className="contract-actions">
                <button
                  onClick={() => openApprovalModal(contract)}
                  className="approve-btn"
                >
                  Approve
                </button>
                <button
                  onClick={() => openRejectionModal(contract)}
                  className="reject-btn"
                >
                  Reject
                </button>
                <button
                  onClick={() => openAssignStaffModal(contract)}
                  className="assign-btn"
                >
                  Assign Staff
                </button>
                <button
                  onClick={() => navigate(`/contracts/${contract._id}`)}
                  className="view-btn"
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Approve Contract</h3>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to approve this contract?</p>
              <div className="form-group">
                <label htmlFor="approvalNotes">Notes (optional)</label>
                <textarea
                  id="approvalNotes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows="3"
                  placeholder="Add any notes about this approval..."
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="approve-btn"
              >
                Approve Contract
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Reject Contract</h3>
              <button
                onClick={() => setShowRejectionModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Please provide a reason for rejecting this contract.</p>
              <div className="form-group">
                <label htmlFor="rejectionReason">Rejection Reason *</label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="3"
                  placeholder="Explain why this contract is being rejected..."
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="rejectionNotes">Additional Notes (optional)</label>
                <textarea
                  id="rejectionNotes"
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  rows="3"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setShowRejectionModal(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="reject-btn"
              >
                Reject Contract
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Staff Modal */}
      {showAssignStaffModal && contractDetails && (
        <div className="modal-overlay">
          <div className="modal large-modal">
            <div className="modal-header">
              <h3>Assign Staff to Contract</h3>
              <button
                onClick={() => setShowAssignStaffModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="contract-summary">
                <h4>Contract Details</h4>
                <p><strong>Contract ID:</strong> {contractDetails.contractId}</p>
                <p><strong>Customer:</strong> {contractDetails.customerId?.name}</p>
                <p><strong>From:</strong> {contractDetails.moveDetails?.fromAddress}</p>
                <p><strong>To:</strong> {contractDetails.moveDetails?.toAddress}</p>
              </div>

              {contractDetails.assignedStaff && contractDetails.assignedStaff.length > 0 && (
                <div className="assigned-staff-list">
                  <h4>Currently Assigned Staff</h4>
                  {contractDetails.assignedStaff.map((assignment, index) => (
                    <div key={index} className="assigned-staff-item">
                      <p>
                        <strong>{assignment.staffId?.userId?.name}</strong> - 
                        {assignment.staffId?.role} - 
                        <span className={`status-badge status-${assignment.status}`}>
                          {assignment.status}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="staffSelect">Select Staff *</label>
                <select
                  id="staffSelect"
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  required
                >
                  <option value="">Select a staff member...</option>
                  {availableStaff.map(staff => (
                    <option key={staff._id} value={staff._id}>
                      {staff.userId?.name} - {staff.role} ({staff.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              {availableStaff.length === 0 && (
                <p className="no-staff-message">No available staff members</p>
              )}

              <div className="form-group">
                <label htmlFor="staffNotes">Notes (optional)</label>
                <textarea
                  id="staffNotes"
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  rows="3"
                  placeholder="Add any notes for this assignment..."
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setShowAssignStaffModal(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignStaff}
                className="assign-btn"
                disabled={!selectedStaffId || availableStaff.length === 0}
              >
                Assign Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractApproval;
