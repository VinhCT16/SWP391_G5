import apiClient from './apiClient';

// Update user profile
export const updateProfile = (profileData) => {
  return apiClient.put('/auth/profile', profileData);
};

// Change password
export const changePassword = (passwordData) => {
  return apiClient.put('/auth/password', passwordData);
};

// Get current user info
export const getCurrentUser = () => {
  return apiClient.get('/auth/me');
};
