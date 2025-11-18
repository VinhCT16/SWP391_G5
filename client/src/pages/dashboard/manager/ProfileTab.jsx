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
            <span className="value">{user?.name || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">Email:</span>
            <span className="value">{user?.email || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">Phone:</span>
            <span className="value">{user?.phone || 'N/A'}</span>
          </div>
        </div>

        <div className="profile-section">
          <h3>Manager Information</h3>
          <div className="info-row">
            <span className="label">Employee ID:</span>
            <span className="value">{user?.employeeId || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">Department:</span>
            <span className="value">{user?.department || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">Role:</span>
            <span className="value">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'}</span>
          </div>
          {user?.hireDate && (
            <div className="info-row">
              <span className="label">Hire Date:</span>
              <span className="value">{new Date(user.hireDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        
        <div className="profile-section">
          <h3>Account Settings</h3>
          <div className="action-buttons">
            <Button variant="secondary" onClick={onOpenProfileModal}>
              Update Profile
            </Button>
            <Button variant="secondary" onClick={onOpenPasswordModal}>
              Change Password
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

