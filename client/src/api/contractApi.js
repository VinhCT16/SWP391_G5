import api from '../apiClient';

// Create contract from request (Manager)
export const createContractFromRequest = (requestId, contractData) => {
  return api.post(`/api/contracts/from-request/${requestId}`, contractData);
};

// Get all contracts (with filtering)
export const getAllContracts = (params = {}) => {
  return api.get('/api/contracts', { params });
};

// Get contract by ID
export const getContractById = (contractId) => {
  return api.get(`/api/contracts/${contractId}`);
};

// Get contracts for approval (Manager)
export const getContractsForApproval = (params = {}) => {
  return api.get('/api/contracts/approval', { params });
};

// Approve contract (Manager)
export const approveContract = (contractId, approvalData = {}) => {
  return api.put(`/api/contracts/${contractId}/approve`, approvalData);
};

// Reject contract (Manager)
export const rejectContract = (contractId, rejectionData) => {
  return api.put(`/api/contracts/${contractId}/reject`, rejectionData);
};

// Approve and assign contract in one call (Manager)
export const approveAndAssignContract = (contractId, staffId, notes = '') => {
  return api.post('/api/contracts/approve', {
    contractId,
    staffId,
    notes
  });
};

// Update contract status (Manager)
export const updateContractStatus = (contractId, statusData) => {
  return api.put(`/api/contracts/${contractId}/status`, statusData);
};

// Assign staff to contract (Manager)
export const assignStaffToContract = (contractId, assignmentData) => {
  return api.post(`/api/contracts/${contractId}/assign-staff`, assignmentData);
};

// Get available staff for contract (Manager)
export const getAvailableStaff = (contractId) => {
  return api.get(`/api/contracts/${contractId}/available-staff`);
};

// Get assigned contracts (Staff)
export const getAssignedContracts = () => {
  return api.get('/api/contracts/staff/assigned');
};

// Accept assignment (Staff)
export const acceptAssignment = (contractId) => {
  return api.post(`/api/contracts/${contractId}/accept-assignment`);
};

// Reject assignment (Staff)
export const rejectAssignment = (contractId, reason = '') => {
  return api.post(`/api/contracts/${contractId}/reject-assignment`, { reason });
};

// Export contract as PDF
export const exportContractPDF = (contractId) => {
  return api.get(`/api/contracts/${contractId}/export`, {
    responseType: 'blob'
  });
};

// Get customer contracts
export const getCustomerContracts = (customerId) => {
  return api.get(`/api/contracts/customer/${customerId}`);
};

// Manager signs contract
export const managerSignContract = (contractId) => {
  return api.put(`/api/contracts/${contractId}/sign`);
};

// Customer signs contract
export const customerSignContract = (contractId) => {
  return api.put(`/api/contracts/${contractId}/customer-sign`);
};

// Get all services (for contract creation)
export const getAllServices = () => {
  return api.get('/api/contracts/services');
};

