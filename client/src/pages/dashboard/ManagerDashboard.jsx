import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllRequests, updateRequestStatus, getAvailableStaffForRequest, assignStaffToRequest } from '../../api/requestApi';
import { getContractsForApproval, approveContract, rejectContract } from '../../api/contractApi';
import ManagerDashboardTabs from './manager/ManagerDashboardTabs';
import ApprovalModal from '../../components/dashboard/ApprovalModal';
import AssignStaffModal from '../../components/dashboard/AssignStaffModal';
import './ManagerDashboard.css';

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalActionType, setApprovalActionType] = useState('approve');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [activeTab, setActiveTab] = useState('requests');
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllRequests({ status: filters.status });
      // Handle both response.requests and response.data?.requests
      setRequests(response.requests || response.data?.requests || []);
    } catch (err) {
      console.error('Error loading requests:', err);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [filters.status]);

  const loadContracts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getContractsForApproval();
      // Handle both response.contracts and response.data?.contracts
      setContracts(response.contracts || response.data?.contracts || []);
    } catch (err) {
      console.error('Error loading contracts:', err);
      setError('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
    loadContracts();
  }, [loadRequests, loadContracts]);

  const handleApproval = async (requestId, approvalData) => {
    try {
      setLoading(true);
      await updateRequestStatus(requestId, approvalData);
      await loadRequests();
      alert(`Request ${approvalData.status} successfully!`);
    } catch (err) {
      console.error('Error updating request:', err);
      setError(err?.response?.data?.message || 'Failed to update request');
    } finally {
      setLoading(false);
    }
  };


  const handleContractApproval = async (contractId, notes) => {
    try {
      setLoading(true);
      await approveContract(contractId, { notes });
      await loadContracts();
      alert('Contract approved successfully!');
    } catch (err) {
      console.error('Error approving contract:', err);
      setError(err?.response?.data?.message || 'Failed to approve contract');
    } finally {
      setLoading(false);
    }
  };

  const handleContractRejection = async (contractId, rejectionReason, notes) => {
    try {
      setLoading(true);
      await rejectContract(contractId, { rejectionReason, notes });
      await loadContracts();
      alert('Contract rejected successfully!');
    } catch (err) {
      console.error('Error rejecting contract:', err);
      setError(err?.response?.data?.message || 'Failed to reject contract');
    } finally {
      setLoading(false);
    }
  };

  const openAssignStaffModal = async (request) => {
    try {
      setSelectedRequest(request);
      const res = await getAvailableStaffForRequest(request._id);
      // Handle both response.availableStaff and response.data?.availableStaff
      setAvailableStaff(res.availableStaff || res.data?.availableStaff || []);
      setShowAssignModal(true);
    } catch (e) {
      setError('Failed to load available staff');
    }
  };

  const handleAssignStaff = async (requestId, data) => {
    try {
      await assignStaffToRequest(requestId, data);
      await loadRequests();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to assign staff');
    }
  };

  const openContractDetail = async (request) => {
    try {
      if (request.contractId) {
        window.location.href = `/contracts/${request.contractId}`;
        return;
      }
      const { getAllContracts } = await import('../../api/contractApi');
      const res = await getAllContracts({ requestId: request._id, limit: 1 });
      // Handle both response.contracts and response.data?.contracts
      const contracts = res.contracts || res.data?.contracts || [];
      const found = contracts[0];
      if (found && found._id) {
        window.location.href = `/contracts/${found._id}`;
      } else {
        alert('No contract found for this request yet.');
      }
    } catch (e) {
      console.error('Error opening contract details:', e);
      alert('Failed to open contract details.');
    }
  };

  return (
    <div className="manager-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">
            <h1>Manager Dashboard</h1>
            <span>Request Management System</span>
          </div>
          <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span>Welcome, {user?.name}</span>
            <button 
              onClick={async () => {
                try {
                  await logout();
                  navigate('/login');
                } catch (err) {
                  console.error('Logout failed:', err);
                }
              }}
              style={{
                padding: '8px 16px',
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#333',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f8f9fa';
                e.target.style.borderColor = '#007bff';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#fff';
                e.target.style.borderColor = '#ddd';
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
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

        {error && <div className="error-message">{error}</div>}
        
        <ManagerDashboardTabs
          activeTab={activeTab}
          requests={requests}
          contracts={contracts}
          loading={loading}
          error={error}
          filters={filters}
          onFilterChange={(key, value) => setFilters({...filters, [key]: value})}
          onRefresh={activeTab === 'requests' ? loadRequests : loadContracts}
          onApprove={(request) => {
            setSelectedRequest(request);
            setApprovalActionType('approve');
            setShowApprovalModal(true);
          }}
          onReject={(request) => {
            setSelectedRequest(request);
            setApprovalActionType('reject');
            setShowApprovalModal(true);
          }}
          onAssignStaff={openAssignStaffModal}
          onViewContract={openContractDetail}
          onView={(contract) => {
            navigate(`/contracts/${contract._id}`);
          }}
          onApproveContract={(contract) => {
            const notes = prompt('Enter approval notes (optional):');
            if (notes !== null) {
              handleContractApproval(contract._id, notes);
            }
          }}
          onRejectContract={(contract) => {
            const rejectionReason = prompt('Enter rejection reason (required):');
            if (rejectionReason) {
              const notes = prompt('Enter additional notes (optional):');
              handleContractRejection(contract._id, rejectionReason, notes || '');
            }
          }}
        />
      </main>

      <ApprovalModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedRequest(null);
          setApprovalActionType('approve');
        }}
        request={selectedRequest}
        onApprove={handleApproval}
        actionType={approvalActionType}
        loading={loading}
      />

      <AssignStaffModal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        availableStaff={availableStaff}
        onAssign={handleAssignStaff}
        loading={loading}
      />
    </div>
  );
}
