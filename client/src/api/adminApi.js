import apiClient from '../apiClient';

const adminApi = {
  // User management
  getAllUsers: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiClient.get(`/admin/users?${queryParams}`);
  },

  getUserStats: () => {
    return apiClient.get('/admin/users/stats');
  },

  getUserById: (userId) => {
    return apiClient.get(`/admin/users/${userId}`);
  },

  createUser: (userData) => {
    return apiClient.post('/admin/users', userData);
  },

  updateUser: (userId, userData) => {
    return apiClient.put(`/admin/users/${userId}`, userData);
  },

  toggleUserStatus: (userId, isActive) => {
    return apiClient.put(`/admin/users/${userId}/toggle-status`, { isActive });
  },

  resetUserPassword: (userId, newPassword) => {
    return apiClient.put(`/admin/users/${userId}/reset-password`, { newPassword });
  },

  deleteUser: (userId) => {
    return apiClient.delete(`/admin/users/${userId}`);
  },

  // Admin profile management
  createAdminProfile: (adminData) => {
    return apiClient.post('/auth/create-admin', adminData);
  },

  // Customer management
  getAllCustomers: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiClient.get(`/admin/customers?${queryParams}`);
  },

  getCustomerStats: () => {
    return apiClient.get('/admin/customers/stats');
  },

  getCustomerById: (customerId) => {
    return apiClient.get(`/admin/customers/${customerId}`);
  },

  updateCustomerAccount: (customerId, customerData) => {
    return apiClient.put(`/admin/customers/${customerId}`, customerData);
  },

  getCustomerComplaints: (customerId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiClient.get(`/admin/customers/${customerId}/complaints?${queryParams}`);
  },

  handleCustomerComplaint: (complaintId, complaintData) => {
    return apiClient.put(`/admin/complaints/${complaintId}`, complaintData);
  },

  // Complaint management
  getAllComplaints: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiClient.get(`/admin/complaints?${queryParams}`);
  },

  getComplaintStats: () => {
    return apiClient.get('/admin/complaints/stats');
  }
};

export default adminApi;
