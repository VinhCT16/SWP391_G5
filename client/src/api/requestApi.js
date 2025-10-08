import api from '../apiClient';

// Create a new moving request
export const createRequest = (requestData) => {
  return api.post('/api/requests', requestData);
};

// Get customer's requests
export const getMyRequests = () => {
  return api.get('/api/requests/my-requests');
};

// Get a specific request by ID
export const getRequestById = (id) => {
  return api.get(`/api/requests/${id}`);
};

// Get all requests (for managers)
export const getAllRequests = (params = {}) => {
  return api.get('/api/requests', { params });
};

// Update request status (for managers)
export const updateRequestStatus = (id, statusData) => {
  return api.put(`/api/requests/${id}/status`, statusData);
};
