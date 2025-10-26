import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createRequest, getMyRequests } from '../api/requestApi';
import { updateProfile, changePassword } from '../api/userApi';
import { getContractsForApproval } from '../api/contractApi';
import BackButton from '../components/BackButton';
import './Home.css';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [requests, setRequests] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    fromAddress: '',
    toAddress: '',
    moveDate: '',
    serviceType: 'Local Move',
    phone: user?.phone || ''
  });
  
  // Profile update states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load user's requests
  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await getMyRequests();
      setRequests(response.data.requests || []);
    } catch (err) {
      console.error('Error loading requests:', err);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  // Load user's contracts
  const loadContracts = async () => {
    try {
      setLoading(true);
      // This would need to be implemented in the API
      // For now, we'll use a mock approach
      const response = await getContractsForApproval();
      setContracts(response.data.contracts || []);
    } catch (err) {
      console.error('Error loading contracts:', err);
      setError('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  // Handle booking form submission
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const requestData = {
        moveDetails: {
          fromAddress: bookingForm.fromAddress,
          toAddress: bookingForm.toAddress,
          moveDate: bookingForm.moveDate,
          serviceType: bookingForm.serviceType,
          phone: bookingForm.phone
        },
        items: [], // Will be enhanced later
        estimatedPrice: {
          basePrice: 0, // Will be calculated later
          additionalServices: [],
          totalPrice: 0
        }
      };

      await createRequest(requestData);
      
      // Reset form
      setBookingForm({
        fromAddress: '',
        toAddress: '',
        moveDate: '',
        serviceType: 'Local Move',
        phone: user?.phone || ''
      });

      // Reload requests
      await loadRequests();
      
      // Switch to my moves tab
      setActiveTab('my-moves');
      
      alert('Request submitted successfully!');
    } catch (err) {
      console.error('Error submitting request:', err);
      setError(err?.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      const response = await updateProfile(profileData);
      
      // Update user context if available
      if (response.data.user) {
        // You might want to update the user context here
        // This depends on how your AuthContext is implemented
      }
      
      setShowProfileModal(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      alert('Password changed successfully!');
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // Open profile modal
  const openProfileModal = () => {
    setProfileData({
      name: user?.name || '',
      phone: user?.phone || ''
    });
    setShowProfileModal(true);
  };

  // Open password modal
  const openPasswordModal = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordModal(true);
  };

  // Load requests on component mount
  useEffect(() => {
    loadRequests();
    loadContracts();
  }, []);

  return (
    <div className="home-container">
      <BackButton fallbackPath="/dashboard" />
      
      <header className="home-header">
        <div className="header-content">
          <div className="logo">
            <h1>Customer Dashboard</h1>
            <span>Manage your moving requests</span>
          </div>
          <div className="user-info">
            <span>Welcome, {user?.name}</span>
          </div>
        </div>
      </header>

      <nav className="home-nav">
        <button 
          className={activeTab === 'dashboard' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'book-move' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('book-move')}
        >
          Book a Move
        </button>
        <button 
          className={activeTab === 'my-moves' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('my-moves')}
        >
          My Moves
        </button>
        <button 
          className={activeTab === 'contracts' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('contracts')}
        >
          Contracts
        </button>
        <button 
          className={activeTab === 'profile' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
      </nav>

      <main className="home-main">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <div className="welcome-section">
              <h2>Welcome back, {user?.name}!</h2>
              <p>Manage your moving needs with ease</p>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card">
                <h3>{requests.filter(r => r.status === 'completed').length}</h3>
                <p>Completed Moves</p>
              </div>
              <div className="stat-card">
                <h3>{requests.filter(r => ['submitted', 'approved', 'contract_created', 'in_progress'].includes(r.status)).length}</h3>
                <p>Active Moves</p>
              </div>
              <div className="stat-card">
                <h3>{requests.length}</h3>
                <p>Total Requests</p>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button className="action-btn primary" onClick={() => setActiveTab('book-move')}>
                  📦 Book New Move
                </button>
                <button className="action-btn secondary" onClick={() => setActiveTab('my-moves')}>
                  📋 View My Moves
                </button>
                <button className="action-btn tertiary" onClick={() => setActiveTab('profile')}>
                  👤 My Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'book-move' && (
          <div className="book-move">
            <h2>Book Your Move</h2>
            {error && (
              <div className="error-message" style={{ color: 'red', marginBottom: '20px', padding: '10px', backgroundColor: '#ffe6e6', border: '1px solid #ffcccc', borderRadius: '4px' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleBookingSubmit} className="booking-form">
              <div className="form-section">
                <h3>Move Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Moving From</label>
                    <input 
                      type="text" 
                      placeholder="Current address" 
                      value={bookingForm.fromAddress}
                      onChange={(e) => setBookingForm({...bookingForm, fromAddress: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Moving To</label>
                    <input 
                      type="text" 
                      placeholder="Destination address" 
                      value={bookingForm.toAddress}
                      onChange={(e) => setBookingForm({...bookingForm, toAddress: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Moving Date</label>
                    <input 
                      type="date" 
                      value={bookingForm.moveDate}
                      onChange={(e) => setBookingForm({...bookingForm, moveDate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Service Type</label>
                    <select 
                      value={bookingForm.serviceType}
                      onChange={(e) => setBookingForm({...bookingForm, serviceType: e.target.value})}
                    >
                      <option value="Local Move">Local Move</option>
                      <option value="Long Distance">Long Distance</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h3>Contact Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="Your phone number" 
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={user?.email} readOnly />
                  </div>
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'my-moves' && (
          <div className="my-moves">
            <h2>My Moves</h2>
            {loading ? (
              <div className="loading-state">
                <p>Loading your moves...</p>
              </div>
            ) : requests.length > 0 ? (
              <div className="moves-list">
                {requests.map((request) => (
                  <div key={request._id} className="move-card" style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '15px',
                    backgroundColor: '#fff'
                  }}>
                    <div className="move-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h3>Request #{request.requestId}</h3>
                      <span className={`status-badge ${request.status}`} style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        backgroundColor: request.status === 'submitted' ? '#e3f2fd' : 
                                        request.status === 'approved' ? '#e8f5e8' : 
                                        request.status === 'rejected' ? '#ffebee' : '#f5f5f5',
                        color: request.status === 'submitted' ? '#1976d2' : 
                               request.status === 'approved' ? '#2e7d32' : 
                               request.status === 'rejected' ? '#d32f2f' : '#666'
                      }}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="move-details">
                      <p><strong>From:</strong> {request.moveDetails.fromAddress}</p>
                      <p><strong>To:</strong> {request.moveDetails.toAddress}</p>
                      <p><strong>Date:</strong> {new Date(request.moveDetails.moveDate).toLocaleDateString()}</p>
                      <p><strong>Service:</strong> {request.moveDetails.serviceType}</p>
                      <p><strong>Phone:</strong> {request.moveDetails.phone}</p>
                      <p><strong>Submitted:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                    {request.approval && (
                      <div className="approval-info" style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                        <p><strong>Review Status:</strong> {request.approval.approved ? 'Approved' : 'Rejected'}</p>
                        {request.approval.rejectionReason && (
                          <p><strong>Reason:</strong> {request.approval.rejectionReason}</p>
                        )}
                        {request.approval.notes && (
                          <p><strong>Notes:</strong> {request.approval.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>No moves booked yet</h3>
                <p>Book your first move to get started!</p>
                <button className="action-btn primary" onClick={() => setActiveTab('book-move')}>
                  Book a Move
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="contracts">
            <h2>My Contracts</h2>
            {loading ? (
              <div className="loading-state">
                <p>Loading contracts...</p>
              </div>
            ) : contracts.length === 0 ? (
              <div className="empty-state">
                <h3>No contracts found</h3>
                <p>You don't have any contracts yet.</p>
              </div>
            ) : (
              <div className="contracts-grid">
                {contracts.map((contract) => (
                  <div key={contract._id} className="contract-card">
                    <div className="contract-header">
                      <h3>Contract #{contract.contractId}</h3>
                      <span className={`status-badge ${contract.status}`}>
                        {contract.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="contract-details">
                      <p><strong>Service:</strong> {contract.serviceId?.name}</p>
                      <p><strong>Total Price:</strong> ${contract.pricing?.totalPrice}</p>
                      <p><strong>Status:</strong> {contract.status}</p>
                      <p><strong>Created:</strong> {new Date(contract.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="contract-actions">
                      <button 
                        className="view-btn"
                        onClick={() => navigate(`/contracts/${contract._id}`)}
                      >
                        View Contract
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile">
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
                <button className="action-btn secondary" onClick={openProfileModal}>Update Profile</button>
                <button className="action-btn secondary" onClick={openPasswordModal}>Change Password</button>
              </div>
              
            </div>
          </div>
        )}
      </main>

      {/* Profile Update Modal */}
      {showProfileModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2>Update Profile</h2>
            {error && (
              <div className="error-message" style={{ color: 'red', marginBottom: '20px', padding: '10px', backgroundColor: '#ffe6e6', border: '1px solid #ffcccc', borderRadius: '4px' }}>
                {error}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); handleProfileUpdate(); }}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name</label>
                <input 
                  type="text" 
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone</label>
                <input 
                  type="tel" 
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowProfileModal(false)}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2>Change Password</h2>
            {error && (
              <div className="error-message" style={{ color: 'red', marginBottom: '20px', padding: '10px', backgroundColor: '#ffe6e6', border: '1px solid #ffcccc', borderRadius: '4px' }}>
                {error}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Current Password</label>
                <input 
                  type="password" 
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>New Password</label>
                <input 
                  type="password" 
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  required
                  minLength="6"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Confirm New Password</label>
                <input 
                  type="password" 
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  required
                  minLength="6"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowPasswordModal(false)}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
