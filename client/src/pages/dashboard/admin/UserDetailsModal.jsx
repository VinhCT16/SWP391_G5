import React from 'react';
import Modal from '../../../components/shared/Modal';
import StatusBadge from '../../../components/shared/StatusBadge';

export default function UserDetailsModal({ user, onClose }) {
  if (!user) return null;

  const { user: userData, profile } = user;

  return (
    <Modal isOpen={true} onClose={onClose} title="User Details" size="large">
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#333', marginBottom: '15px', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px' }}>
            Basic Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <strong>Name:</strong> {userData.name}
            </div>
            <div>
              <strong>Email:</strong> {userData.email}
            </div>
            <div>
              <strong>Phone:</strong> {userData.phone || 'N/A'}
            </div>
            <div>
              <strong>Role:</strong> 
              <span style={{ 
                textTransform: 'capitalize', 
                marginLeft: '8px',
                padding: '4px 8px',
                background: '#e9ecef',
                borderRadius: '4px'
              }}>
                {userData.role}
              </span>
            </div>
            <div>
              <strong>Status:</strong> 
              <span style={{ marginLeft: '8px' }}>
                <StatusBadge status={userData.isActive ? 'active' : 'locked'} />
              </span>
            </div>
            <div>
              <strong>Created:</strong> {new Date(userData.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        {profile && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#333', marginBottom: '15px', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px' }}>
              Role-Specific Information
            </h3>
            {userData.role === 'staff' && profile.staffRole && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <strong>Employee ID:</strong> {profile.employeeId || 'N/A'}
                </div>
                <div>
                  <strong>Staff Role:</strong> 
                  <span style={{ textTransform: 'capitalize', marginLeft: '8px' }}>
                    {profile.staffRole}
                  </span>
                </div>
                {profile.specialization && profile.specialization.length > 0 && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Specializations:</strong>
                    <div style={{ marginTop: '5px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {profile.specialization.map((spec, idx) => (
                        <span key={idx} style={{
                          padding: '4px 8px',
                          background: '#e9ecef',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          {spec.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.rating && (
                  <div>
                    <strong>Rating:</strong> {profile.rating}/5
                  </div>
                )}
              </div>
            )}

            {userData.role === 'manager' && profile.department && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <strong>Employee ID:</strong> {profile.employeeId || 'N/A'}
                </div>
                <div>
                  <strong>Department:</strong> {profile.department}
                </div>
                {profile.managerPermissions && profile.managerPermissions.length > 0 && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Permissions:</strong>
                    <div style={{ marginTop: '5px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {profile.managerPermissions.map((perm, idx) => (
                        <span key={idx} style={{
                          padding: '4px 8px',
                          background: '#d1ecf1',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          {perm.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {userData.role === 'admin' && profile.adminId && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <strong>Admin ID:</strong> {profile.adminId}
                </div>
                <div>
                  <strong>Department:</strong> {profile.department || 'N/A'}
                </div>
                {profile.adminPermissions && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Permissions:</strong>
                    <div style={{ marginTop: '10px' }}>
                      {profile.adminPermissions.userManagement && (
                        <div style={{ marginBottom: '10px' }}>
                          <strong style={{ color: '#666' }}>User Management:</strong>
                          <div style={{ marginTop: '5px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            {Object.entries(profile.adminPermissions.userManagement)
                              .filter(([_, value]) => value)
                              .map(([key, _]) => (
                                <span key={key} style={{
                                  padding: '4px 8px',
                                  background: '#d4edda',
                                  borderRadius: '4px',
                                  fontSize: '12px'
                                }}>
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

