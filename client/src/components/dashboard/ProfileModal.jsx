import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { useProfile } from '../../hooks/useProfile';

export default function ProfileModal({ isOpen, onClose, user, onSuccess }) {
  const { updateUserProfile, loading, error } = useProfile();
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });

  useEffect(() => {
    if (isOpen) {
      setProfileData({
        name: user?.name || '',
        phone: user?.phone || ''
      });
    }
  }, [isOpen, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUserProfile(profileData);
      onSuccess?.();
      onClose();
    } catch (err) {
      // Error is handled by hook
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Profile">
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={profileData.name}
            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input
            type="tel"
            value={profileData.phone}
            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={user?.email}
            disabled
            className="form-input"
            style={{ backgroundColor: '#f5f5f5', color: '#666' }}
          />
          <small style={{ color: '#666' }}>Email cannot be changed</small>
        </div>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

