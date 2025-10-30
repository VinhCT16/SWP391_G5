import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getContractById, exportContractPDF, getAvailableStaff, assignStaffToContract } from '../api/contractApi';
import { useAuth } from '../context/AuthContext';
import './CustomerContractView.css';

const ContractDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  const loadContract = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getContractById(id);
      setContract(response.data.contract);
    } catch (err) {
      setError('Failed to load contract');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadContract();
  }, [loadContract]);

  const handleExportPDF = async () => {
    try {
      const response = await exportContractPDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contract-${contract.contractId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export PDF');
    }
  };

  const openAssignModal = async () => {
    try {
      setAssignModalOpen(true);
      setAvailableStaff([]);
      setSelectedStaffId('');
      setAssignNotes('');
      const res = await getAvailableStaff(contract._id);
      setAvailableStaff(res.data.availableStaff || []);
    } catch (err) {
      setError('Failed to load staff list');
      setAssignModalOpen(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedStaffId) return;
    try {
      await assignStaffToContract(contract._id, { staffId: selectedStaffId, notes: assignNotes });
      setAssignModalOpen(false);
      setSelectedStaffId('');
      setAssignNotes('');
      await loadContract();
    } catch (err) {
      setError('Failed to assign staff');
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
      cancelled: { class: 'status-cancelled', text: 'Cancelled' },
    };
    const config = statusConfig[status] || { class: 'status-default', text: status };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  if (loading) {
    return <div className="contract-view-container"><div className="loading">Loading contract...</div></div>;
  }
  if (error) {
    return (
      <div className="contract-view-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/dashboard')} className="back-btn">Back to Dashboard</button>
      </div>
    );
  }
  if (!contract) {
    return (
      <div className="contract-view-container">
        <div className="no-contract"><h2>Contract not found</h2>
          <button onClick={() => navigate('/dashboard')} className="back-btn">Back to Dashboard</button>
        </div>
      </div>
    );
  }
  return (
    <div className="contract-view-container">
      <div className="contract-view-header">
        <div className="header-content">
          <h1>Contract Details</h1>
          <p>Contract #{contract.contractId}</p>
        </div>
        <div className="header-actions">
          {getStatusBadge(contract.status)}
          <button onClick={handleExportPDF} className="export-btn">Export PDF</button>
        </div>
      </div>
      <div className="contract-content">
        {/* [Retain all detail sections as before...] */}
        {/* Assigned Staff */}
        {contract.assignedStaff && contract.assignedStaff.length > 0 && (
          <div className="contract-section">
            <h2>Assigned Staff</h2>
            <div className="staff-list">
              {contract.assignedStaff.map((assignment, index) => (
                <div key={index} className="staff-item">
                  <div className="staff-info">
                    <h3>{assignment.staffId?.userId?.name || 'Unknown Staff'}</h3>
                    <p>Role: {assignment.staffId?.role || 'N/A'}</p>
                    <p>Employee ID: {assignment.staffId?.employeeId || 'N/A'}</p>
                    {assignment.staffId?.userId?.phone && (
                      <p>Phone: {assignment.staffId.userId.phone}</p>
                    )}
                  </div>
                  <div className="staff-status">
                    <span className={`status-badge status-${assignment.status}`}>
                      {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                    </span>
                    {assignment.acceptedAt && (
                      <p className="accepted-date">Accepted: {formatDate(assignment.acceptedAt)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Only manager can see Assign Staff button and only if status is approved or pending_approval */}
            {user?.role === 'manager' && (contract.status === 'approved' || contract.status === 'pending_approval') && (
              <div className="manager-actions">
                <button className="assign-btn" onClick={openAssignModal}>Assign Staff</button>
              </div>
            )}
          </div>
        )}
        {/* If no staff assigned, manager can still assign if approved */}
        {user?.role === 'manager' && (!contract.assignedStaff || contract.assignedStaff.length === 0) && (contract.status === 'approved' || contract.status === 'pending_approval') && (
          <div className="contract-section">
            <div className="manager-actions">
              <button className="assign-btn" onClick={openAssignModal}>Assign Staff</button>
            </div>
          </div>
        )}
      </div>
      {assignModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Assign Staff</h3>
            <div className="form-group">
              <label>Select Staff</label>
              <select value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)}>
                <option value="">-- Select Staff --</option>
                {availableStaff.map(staff => (
                  <option key={staff._id} value={staff._id}>
                    {staff.userId?.name || staff.employeeId} ({staff.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea value={assignNotes} onChange={e => setAssignNotes(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setAssignModalOpen(false)}>Cancel</button>
              <button className="assign-btn" disabled={!selectedStaffId} onClick={handleAssignStaff}>Assign</button>
            </div>
          </div>
        </div>
      )}
      <div className="contract-actions">
        <button onClick={() => navigate('/dashboard')} className="back-btn">Back to Dashboard</button>
      </div>
    </div>
  );
};

export default ContractDetailView;
