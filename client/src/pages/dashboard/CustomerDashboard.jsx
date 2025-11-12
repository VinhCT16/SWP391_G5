import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyRequests } from '../../api/requestApi';
import { getAllContracts } from '../../api/contractApi';
import CustomerDashboardTabs from './customer/CustomerDashboardTabs';
import ProfileModal from '../../components/dashboard/ProfileModal';
import PasswordModal from '../../components/dashboard/PasswordModal';
import './CustomerDashboard.css';

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [requests, setRequests] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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

  useEffect(() => {
    loadRequests();
    loadContracts();
  }, []);

  const handleRequestSuccess = () => {
    loadRequests();
    setActiveTab('my-moves');
  };

  const handleProfileSuccess = () => {
    loadRequests();
    loadContracts();
  };

  return (
    <div className="customer-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div>
            <h1>Customer Dashboard</h1>
            <span>Manage your moving requests</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span>Welcome, {user?.name}</span>
            <button 
              onClick={async () => {
                try {
                  await logout();
                  navigate('/login');
                } catch (err) {
                  console.error('Logout failed:', err);
                }
              }}
              style={{
                padding: '8px 16px',
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#333',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f8f9fa';
                e.target.style.borderColor = '#007bff';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#fff';
                e.target.style.borderColor = '#ddd';
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
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
          className={activeTab === 'progress' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('progress')}
        >
          Track Progress
        </button>
        <button 
          className={activeTab === 'profile' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
      </nav>

      <main className="dashboard-main">
        {error && <div className="error-message">{error}</div>}
        <CustomerDashboardTabs
          activeTab={activeTab}
          user={user}
          requests={requests}
          contracts={contracts}
          loading={loading}
          setLoading={setLoading}
          error={error}
          setError={setError}
          onTabChange={setActiveTab}
          onSuccess={handleRequestSuccess}
          onOpenProfileModal={() => setShowProfileModal(true)}
          onOpenPasswordModal={() => setShowPasswordModal(true)}
        />
      </main>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onSuccess={handleProfileSuccess}
      />

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handleProfileSuccess}
      />
    </div>
  );
}
