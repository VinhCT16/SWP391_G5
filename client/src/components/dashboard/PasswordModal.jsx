import React, { useState } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { useProfile } from '../../hooks/useProfile';

export default function PasswordModal({ isOpen, onClose, onSuccess }) {
  const { changeUserPassword, loading, error } = useProfile();
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await changeUserPassword(passwordData);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      // Error is handled by hook
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Current Password</label>
          <input
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
            required
            minLength="6"
            className="form-input"
          />
          <small style={{ color: '#666' }}>Minimum 6 characters</small>
        </div>
        <div className="form-group">
          <label>Confirm New Password</label>
          <input
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
            required
            minLength="6"
            className="form-input"
          />
        </div>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="danger" disabled={loading}>
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

