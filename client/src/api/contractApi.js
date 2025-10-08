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
