import api from '../apiClient';

// Create contract from approved request
export const createContractFromRequest = (requestId, contractData) => {
  return api.post(`/api/contracts/from-request/${requestId}`, contractData);
};

// Get contract by ID
export const getContractById = (id) => {
  return api.get(`/api/contracts/${id}`);
};

// Get all contracts
export const getAllContracts = (params = {}) => {
  return api.get('/api/contracts', { params });
};

// Update contract status
export const updateContractStatus = (id, statusData) => {
  return api.put(`/api/contracts/${id}/status`, statusData);
};

// Export contract to PDF
export const exportContractPDF = (id) => {
  return api.get(`/api/contracts/${id}/export`, {
    responseType: 'blob'
  });
};

// Approve contract
export const approveContract = (id, data) => {
  return api.put(`/api/contracts/${id}/approve`, data);
};

// Reject contract
export const rejectContract = (id, data) => {
  return api.put(`/api/contracts/${id}/reject`, data);
};

// Get contracts for approval
export const getContractsForApproval = (params = {}) => {
  return api.get('/api/contracts/approval', { params });
};

// Staff assignment (Manager)
export const assignStaffToContract = (contractId, data) => {
  return api.post(`/api/contracts/${contractId}/assign-staff`, data);
};

export const getAvailableStaff = (contractId) => {
  return api.get(`/api/contracts/${contractId}/available-staff`);
};

// Staff assignment actions
export const acceptAssignment = (contractId) => {
  return api.post(`/api/contracts/${contractId}/accept-assignment`);
};

export const rejectAssignment = (contractId, data) => {
  return api.post(`/api/contracts/${contractId}/reject-assignment`, data);
};

export const getAssignedContracts = () => {
  return api.get('/api/contracts/staff/assigned');
};