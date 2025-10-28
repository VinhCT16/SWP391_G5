import api from '../apiClient';

// Update user profile
export const updateProfile = (profileData) => {
  return api.put('/api/auth/profile', profileData);
};

// Change password
export const changePassword = (passwordData) => {
  return api.put('/api/auth/password', passwordData);
};

// Get current user info
export const getCurrentUser = () => {
  return api.get('/api/auth/me');
};
