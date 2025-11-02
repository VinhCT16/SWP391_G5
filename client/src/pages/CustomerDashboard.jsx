import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createRequest, getMyRequests } from '../api/requestApi';
import { updateProfile, changePassword } from '../api/userApi';
import { getAllContracts } from '../api/contractApi';
import { getContractsForApproval, getCustomerContracts } from '../api/contractApi';
import BackButton from '../components/BackButton';
import CustomerProgressTracking from '../components/CustomerProgressTracking';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Inline styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8f9fa'
    },
    header: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '20px 0'
    },
    headerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    logoH1: {
      margin: 0,
      fontSize: '2rem'
    },
    logoSpan: {
      opacity: 0.9,
      fontSize: '0.9rem'
    },
    userInfo: {
      fontSize: '1.1rem'
    },
    nav: {
      background: 'white',
      borderBottom: '1px solid #dee2e6',
      padding: '0 20px'
    },
    navBtn: {
      background: 'none',
      border: 'none',
      padding: '15px 20px',
      marginRight: '10px',
      cursor: 'pointer',
      fontSize: '1rem',
      color: '#666',
      borderBottom: '3px solid transparent',
      transition: 'all 0.3s ease'
    },
    navBtnActive: {
      color: '#007bff',
      borderBottomColor: '#007bff',
      fontWeight: 'bold'
    },
    main: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px'
    },
    dashboard: {
      background: 'white',
      padding: '30px',
      borderRadius: '10px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    welcomeSection: {
      textAlign: 'center',
      marginBottom: '40px'
    },
    welcomeH2: {
      color: '#333',
      marginBottom: '10px'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '40px'
    },
    statCard: {
      background: '#f8f9fa',
      padding: '20px',
      borderRadius: '8px',
      textAlign: 'center',
      borderLeft: '4px solid #007bff'
    },
    statCardH3: {
      fontSize: '2rem',
      margin: '0 0 10px 0',
      color: '#007bff'
    },
    statCardP: {
      margin: 0,
      color: '#666',
      fontWeight: 500
    },
    quickActions: {
      marginTop: '40px'
    },
    quickActionsH3: {
      marginBottom: '20px',
      color: '#333'
    },
    actionButtons: {
      display: 'flex',
      gap: '15px',
      flexWrap: 'wrap'
    },
    actionBtn: {
      padding: '12px 24px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 500,
      transition: 'all 0.3s ease'
    },
    actionBtnPrimary: {
      background: '#007bff',
      color: 'white'
    },
    actionBtnSecondary: {
      background: '#6c757d',
      color: 'white'
    },
    actionBtnTertiary: {
      background: '#17a2b8',
      color: 'white'
    },
    formSection: {
      marginBottom: '30px'
    },
    formSectionH3: {
      marginBottom: '15px',
      color: '#333'
    },
    formRow: {
      display: 'flex',
      gap: '20px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    },
    formGroup: {
      flex: '1',
      minWidth: '250px'
    },
    formLabel: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: 'bold',
      color: '#555'
    },
    formInput: {
      width: '100%',
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '16px',
      boxSizing: 'border-box'
    },
    formSelect: {
      width: '100%',
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '16px',
      boxSizing: 'border-box'
    },
    submitBtn: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '16px',
      cursor: 'pointer',
      marginTop: '20px'
    },
    submitBtnDisabled: {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    },
    errorMessage: {
      color: 'red',
      marginBottom: '20px',
      padding: '10px',
      backgroundColor: '#ffe6e6',
      border: '1px solid #ffcccc',
      borderRadius: '4px'
    },
    loadingState: {
      textAlign: 'center',
      padding: '40px',
      color: '#666'
    },
    movesList: {},
    moveCard: {
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '15px',
      backgroundColor: '#fff'
    },
    moveHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '10px'
    },
    statusBadge: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold',
      textTransform: 'uppercase'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#666'
    },
    emptyStateH3: {
      marginBottom: '10px',
      color: '#333'
    },
    modalOverlay: {
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
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '8px',
      width: '90%',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    modalH2: {
      marginTop: 0,
      marginBottom: '20px',
      color: '#333'
    },
    modalActions: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end',
      marginTop: '20px'
    },
    btnSecondary: {
      padding: '10px 20px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: 'white',
      cursor: 'pointer'
    },
    btnPrimary: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '4px',
      backgroundColor: '#007bff',
      color: 'white',
      cursor: 'pointer'
    }
  };
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
      const response = await getAllContracts();
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
    <div style={styles.container}>
      <BackButton fallbackPath="/dashboard" />
      
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.logoH1}>Customer Dashboard</h1>
            <span style={styles.logoSpan}>Manage your moving requests</span>
          </div>
          <div style={styles.userInfo}>
            <span>Welcome, {user?.name}</span>
          </div>
        </div>
      </header>

      <nav style={styles.nav}>
        <button 
          style={{
            ...styles.navBtn,
            ...(activeTab === 'dashboard' ? styles.navBtnActive : {})
          }}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          style={{
            ...styles.navBtn,
            ...(activeTab === 'book-move' ? styles.navBtnActive : {})
          }}
          onClick={() => setActiveTab('book-move')}
        >
          Book a Move
        </button>
        <button 
          style={{
            ...styles.navBtn,
            ...(activeTab === 'my-moves' ? styles.navBtnActive : {})
          }}
          onClick={() => setActiveTab('my-moves')}
        >
          My Moves
        </button>
        <button 
          style={{
            ...styles.navBtn,
            ...(activeTab === 'contracts' ? styles.navBtnActive : {})
          }}
          onClick={() => setActiveTab('contracts')}
        >
          Contracts
        </button>
        <button 
          style={{
            ...styles.navBtn,
            ...(activeTab === 'progress' ? styles.navBtnActive : {})
          }}
          onClick={() => setActiveTab('progress')}
        >
          Track Progress
        </button>
        <button 
          style={{
            ...styles.navBtn,
            ...(activeTab === 'profile' ? styles.navBtnActive : {})
          }}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
      </nav>

      <main style={styles.main}>
        {activeTab === 'dashboard' && (
          <div style={styles.dashboard}>
            <div style={styles.welcomeSection}>
              <h2 style={styles.welcomeH2}>Welcome back, {user?.name}!</h2>
              <p>Manage your moving needs with ease</p>
            </div>
            
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <h3 style={styles.statCardH3}>{requests.filter(r => r.status === 'completed').length}</h3>
                <p style={styles.statCardP}>Completed Moves</p>
              </div>
              <div style={styles.statCard}>
                <h3 style={styles.statCardH3}>{requests.filter(r => ['submitted', 'approved', 'contract_created', 'in_progress'].includes(r.status)).length}</h3>
                <p style={styles.statCardP}>Active Moves</p>
              </div>
              <div style={styles.statCard}>
                <h3 style={styles.statCardH3}>{requests.length}</h3>
                <p style={styles.statCardP}>Total Requests</p>
              </div>
            </div>

            <div style={styles.quickActions}>
              <h3 style={styles.quickActionsH3}>Quick Actions</h3>
              <div style={styles.actionButtons}>
                <button 
                  style={{ ...styles.actionBtn, ...styles.actionBtnPrimary }} 
                  onClick={() => setActiveTab('book-move')}
                >
                  📦 Book New Move
                </button>
                <button 
                  style={{ ...styles.actionBtn, ...styles.actionBtnSecondary }} 
                  onClick={() => setActiveTab('my-moves')}
                >
                  📋 View My Moves
                </button>
                <button 
                  style={{ ...styles.actionBtn, ...styles.actionBtnTertiary }} 
                  onClick={() => setActiveTab('profile')}
                >
                  👤 My Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'book-move' && (
          <div style={styles.dashboard}>
            <h2 style={styles.welcomeH2}>Book Your Move</h2>
            {error && (
              <div style={styles.errorMessage}>
                {error}
              </div>
            )}
            <form onSubmit={handleBookingSubmit}>
              <div style={styles.formSection}>
                <h3 style={styles.formSectionH3}>Move Details</h3>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Moving From</label>
                    <input 
                      type="text" 
                      placeholder="Current address" 
                      value={bookingForm.fromAddress}
                      onChange={(e) => setBookingForm({...bookingForm, fromAddress: e.target.value})}
                      required
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Moving To</label>
                    <input 
                      type="text" 
                      placeholder="Destination address" 
                      value={bookingForm.toAddress}
                      onChange={(e) => setBookingForm({...bookingForm, toAddress: e.target.value})}
                      required
                      style={styles.formInput}
                    />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Moving Date</label>
                    <input 
                      type="date" 
                      value={bookingForm.moveDate}
                      onChange={(e) => setBookingForm({...bookingForm, moveDate: e.target.value})}
                      required
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Service Type</label>
                    <select 
                      value={bookingForm.serviceType}
                      onChange={(e) => setBookingForm({...bookingForm, serviceType: e.target.value})}
                      style={styles.formSelect}
                    >
                      <option value="Local Move">Local Move</option>
                      <option value="Long Distance">Long Distance</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div style={styles.formSection}>
                <h3 style={styles.formSectionH3}>Contact Information</h3>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="Your phone number" 
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                      required
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Email</label>
                    <input type="email" value={user?.email} readOnly style={styles.formInput} />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                style={{
                  ...styles.submitBtn,
                  ...(loading ? styles.submitBtnDisabled : {})
                }} 
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'my-moves' && (
          <div style={styles.dashboard}>
            <h2 style={styles.welcomeH2}>My Moves</h2>
            {loading ? (
              <div style={styles.loadingState}>
                <p>Loading your moves...</p>
              </div>
            ) : requests.length > 0 ? (
              <div style={styles.movesList}>
                {requests.map((request) => {
                  const getStatusColor = (status) => {
                    switch(status) {
                      case 'submitted': return { bg: '#e3f2fd', color: '#1976d2' };
                      case 'approved': return { bg: '#e8f5e8', color: '#2e7d32' };
                      case 'rejected': return { bg: '#ffebee', color: '#d32f2f' };
                      default: return { bg: '#f5f5f5', color: '#666' };
                    }
                  };
                  const statusColors = getStatusColor(request.status);
                  return (
                    <div key={request._id} style={styles.moveCard}>
                      <div style={styles.moveHeader}>
                        <h3 style={{ margin: 0 }}>Request #{request.requestId}</h3>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: statusColors.bg,
                          color: statusColors.color
                        }}>
                          {request.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div style={{ color: '#333' }}>
                        <p><strong>From:</strong> {request.moveDetails?.fromAddress}</p>
                        <p><strong>To:</strong> {request.moveDetails?.toAddress}</p>
                        <p><strong>Date:</strong> {request.moveDetails?.moveDate ? new Date(request.moveDetails.moveDate).toLocaleDateString() : 'N/A'}</p>
                        <p><strong>Service:</strong> {request.moveDetails?.serviceType}</p>
                        <p><strong>Phone:</strong> {request.moveDetails?.phone}</p>
                        <p><strong>Submitted:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
                      </div>
                      {request.approval && (
                        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
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
                  );
                })}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <h3 style={styles.emptyStateH3}>No moves booked yet</h3>
                <p>Book your first move to get started!</p>
                <button 
                  style={{ ...styles.actionBtn, ...styles.actionBtnPrimary }} 
                  onClick={() => setActiveTab('book-move')}
                >
                  Book a Move
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contracts' && (
          <div style={styles.dashboard}>
            <h2 style={styles.welcomeH2}>My Contracts</h2>
            {loading ? (
              <div style={styles.loadingState}>
                <p>Loading contracts...</p>
              </div>
            ) : contracts.length === 0 ? (
              <div style={styles.emptyState}>
                <h3 style={styles.emptyStateH3}>No contracts found</h3>
                <p>You don't have any contracts yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {contracts.map((contract) => (
                  <div key={contract._id} style={{ ...styles.moveCard, background: 'white' }}>
                    <div style={styles.moveHeader}>
                      <h3 style={{ margin: 0 }}>Contract #{contract.contractId}</h3>
                      <span style={styles.statusBadge}>
                        {contract.status?.replace('_', ' ') || contract.status}
                      </span>
                    </div>
                    <div style={{ color: '#333', marginBottom: '15px' }}>
                      <p><strong>Service:</strong> {contract.serviceId?.name || 'N/A'}</p>
                      <p><strong>Total Price:</strong> ${contract.pricing?.totalPrice || 0}</p>
                      <p><strong>Status:</strong> {contract.status}</p>
                      <p><strong>Created:</strong> {new Date(contract.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <button 
                        style={{ ...styles.actionBtn, ...styles.actionBtnPrimary }}
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

        {activeTab === 'progress' && (
          <CustomerProgressTracking />
        )}

        {activeTab === 'profile' && (
          <div style={styles.dashboard}>
            <h2 style={styles.welcomeH2}>My Profile</h2>
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: '#333', marginBottom: '15px' }}>Personal Information</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                  <span style={{ fontWeight: 'bold', color: '#555' }}>Name:</span>
                  <span style={{ color: '#333' }}>{user?.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                  <span style={{ fontWeight: 'bold', color: '#555' }}>Email:</span>
                  <span style={{ color: '#333' }}>{user?.email}</span>
                </div>
              </div>
              
              <div>
                <h3 style={{ color: '#333', marginBottom: '15px' }}>Account Settings</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button 
                    style={{ ...styles.actionBtn, ...styles.actionBtnSecondary }} 
                    onClick={openProfileModal}
                  >
                    Update Profile
                  </button>
                  <button 
                    style={{ ...styles.actionBtn, ...styles.actionBtnSecondary }} 
                    onClick={openPasswordModal}
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Profile Update Modal */}
      {showProfileModal && (
        <div style={styles.modalOverlay} onClick={() => setShowProfileModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalH2}>Update Profile</h2>
            {error && (
              <div style={styles.errorMessage}>
                {error}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); handleProfileUpdate(); }}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Name</label>
                <input 
                  type="text" 
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  required
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Phone</label>
                <input 
                  type="tel" 
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  required
                  style={styles.formInput}
                />
              </div>
              <div style={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={() => setShowProfileModal(false)}
                  style={styles.btnSecondary}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{
                    ...styles.btnPrimary,
                    ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {})
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
        <div style={styles.modalOverlay} onClick={() => setShowPasswordModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalH2}>Change Password</h2>
            {error && (
              <div style={styles.errorMessage}>
                {error}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Current Password</label>
                <input 
                  type="password" 
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  required
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>New Password</label>
                <input 
                  type="password" 
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  required
                  minLength="6"
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Confirm New Password</label>
                <input 
                  type="password" 
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  required
                  minLength="6"
                  style={styles.formInput}
                />
              </div>
              <div style={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={() => setShowPasswordModal(false)}
                  style={styles.btnSecondary}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{
                    ...styles.actionBtn,
                    background: '#dc3545',
                    color: 'white',
                    ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {})
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
