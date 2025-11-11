import api from '../apiClient';

// Create contract from approved request
export const createContractFromRequest = (requestId, contractData) => {
  return api.post(`/contracts/from-request/${requestId}`, contractData);
};

// Get contract by ID
export const getContractById = (id) => {
  return api.get(`/contracts/${id}`);
};

// Get all contracts
export const getAllContracts = (params = {}) => {
  return api.get('/contracts', { params });
};

// Update contract status
export const updateContractStatus = (id, statusData) => {
  return api.put(`/contracts/${id}/status`, statusData);
};

// Export contract to PDF
export const exportContractPDF = (id) => {
  return api.get(`/contracts/${id}/export`, {
    responseType: 'blob'
  });
};

// Approve contract
export const approveContract = (id, data) => {
  return api.put(`/contracts/${id}/approve`, data);
};

// Reject contract
export const rejectContract = (id, data) => {
  return api.put(`/contracts/${id}/reject`, data);
};

// Get contracts for approval
export const getContractsForApproval = (params = {}) => {
  return api.get('/contracts/approval', { params });
};

// Get customer contracts
export const getCustomerContracts = () => {
  return api.get('/contracts/customer');
};

// Get contract progress
export const getContractProgress = (contractId) => {
  return api.get(`/contracts/${contractId}/progress`);
};

// Staff assignment (Manager)
export const assignStaffToContract = (contractId, data) => {
  return api.post(`/contracts/${contractId}/assign-staff`, data);
};

export const getAvailableStaff = (contractId) => {
  return api.get(`/contracts/${contractId}/available-staff`);
};

// Staff assignment actions
export const acceptAssignment = (contractId) => {
  return api.post(`/contracts/${contractId}/accept-assignment`);
};

export const rejectAssignment = (contractId, data) => {
  return api.post(`/contracts/${contractId}/reject-assignment`, data);
};

export const getAssignedContracts = () => {
  return api.get('/contracts/staff/assigned');
};

// Approve and assign staff in one call
export const approveAndAssignContract = (data) => {
  return api.post('/contracts/approve', data);
};