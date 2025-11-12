import React from 'react';
import Button from '../../../components/shared/Button';

export default function ProfileTab({ user, onOpenProfileModal, onOpenPasswordModal }) {
  return (
    <div className="dashboard-section">
      <h2>My Profile</h2>
      <div className="profile-info">
        <div className="profile-section">
          <h3>Personal Information</h3>
          <div className="info-row">
            <span className="label">Name:</span>
            <span className="value">{user?.name}</span>
          </div>
          <div className="info-row">
            <span className="label">Email:</span>
            <span className="value">{user?.email}</span>
          </div>
        </div>
        <div className="profile-section">
          <h3>Account Settings</h3>
          <div className="action-buttons">
            <Button variant="secondary" onClick={onOpenProfileModal}>Update Profile</Button>
            <Button variant="secondary" onClick={onOpenPasswordModal}>Change Password</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

