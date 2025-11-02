import apiClient from '../apiClient';

// Get current user profile
export const getProfile = () => {
  return apiClient.get('/api/auth/me');
};

// Update user profile
export const updateProfile = (profileData) => {
  return apiClient.put('/api/auth/profile', profileData);
};

// Change password
export const changePassword = (passwordData) => {
  return apiClient.put('/api/auth/password', passwordData);
};

// Create manager profile
export const createManagerProfile = (managerData) => {
  return apiClient.post('/api/auth/create-manager', managerData);
};

// Create staff profile
export const createStaffProfile = (staffData) => {
  return apiClient.post('/api/auth/create-staff', staffData);
};

// Create admin profile
export const createAdminProfile = (adminData) => {
  return apiClient.post('/api/auth/create-admin', adminData);
};

// Default export for backward compatibility
const userApi = {
  getProfile,
  updateProfile,
  changePassword,
  createManagerProfile,
  createStaffProfile,
  createAdminProfile
};

export default userApi;