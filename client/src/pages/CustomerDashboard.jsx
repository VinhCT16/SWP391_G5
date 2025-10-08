import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createRequest, getMyRequests } from '../api/requestApi';
import BackButton from '../components/BackButton';
import './Home.css';

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [requests, setRequests] = useState([]);
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

  // Load requests on component mount
  useEffect(() => {
    loadRequests();
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
                <button className="action-btn secondary">Update Profile</button>
                <button className="action-btn secondary">Change Password</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
