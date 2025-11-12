import { useState } from 'react';
import { updateProfile, changePassword } from '../api/userApi';

export function useProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateUserProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await updateProfile(profileData);
      return response.data;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Failed to update profile';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changeUserPassword = async (passwordData) => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      throw new Error('New passwords do not match');
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      throw new Error('New password must be at least 6 characters long');
    }

    try {
      setLoading(true);
      setError(null);
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Failed to change password';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateUserProfile,
    changeUserPassword,
    loading,
    error
  };
}

