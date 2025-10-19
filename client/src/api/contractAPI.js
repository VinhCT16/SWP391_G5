import api from '../apiClient';

export const createContractFromRequest = (requestId, data) =>
  api.post(`/api/contracts/from-request/${requestId}`, data);

export const listContracts = (params) =>
  api.get('/api/contracts', { params });

export const getContract = (id) =>
  api.get(`/api/contracts/${id}`);

export const updateContract = (id, data) =>
  api.patch(`/api/contracts/${id}`, data);

export const issueContract = (id) =>
  api.post(`/api/contracts/${id}/issue`);

export const acceptContract = (id) =>
  api.post(`/api/contracts/${id}/accept`);

export const rejectContract = (id) =>
  api.post(`/api/contracts/${id}/reject`);

export const cancelContract = (id) =>
  api.post(`/api/contracts/${id}/cancel`);


